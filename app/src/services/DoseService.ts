import {
  getMedicationForm,
  type Dose,
  type DoseLog,
  type DoseStatus,
  type Medication,
  type DosePlan,
} from '@/models';
import { addDays, atTime, formatDate } from '@/utils/date';
import { logger } from '@/utils/logger';
import { isScheduledOn } from '@/utils/schedule';
import { DAY_PERIODS, dayPeriodOf, formatTime, type DayPeriod } from '@/utils/time';

import type { NotificationService } from './NotificationService';
import type { IStorage } from './StorageService';

/** Doz onayından sonra kaydedilen yeni durum. */
export type DoseState = {
  medications: Medication[];
  doseLogs: DoseLog[];
};

/** Doz onaylanınca ertelenmiş bildirimi kaldıran taraf. */
export type SnoozeCanceller = Pick<NotificationService, 'cancelSnooze'>;

/** Geçmiş ekranındaki günün rengi: hepsi, bir kısmı, hiçbiri; doz yoksa veya sürüyorsa nötr. */
export type DaySummary = 'all' | 'some' | 'none' | 'open';

export type HistoryDay = { day: Date; date: string; doses: Dose[]; summary: DaySummary };

export type HistoryWeek = {
  days: HistoryDay[];
  taken: number;
  missed: number;
  /** Yüzde; sonuçlanmış doz yoksa null. */
  adherence: number | null;
};

export type DoseGroup = { period: DayPeriod; doses: Dose[] };

/** İlacın bir planının geçerli olduğu zaman aralığı: [from, until). */
type PlanPeriod = { plan: DosePlan; from: number; until: number };

/**
 * Doz kimliği, günlük doz durumu, onay ve stok düşme kuralları.
 * Durum saklanmaz; yalnızca alınan dozlar `DoseLog` olarak yazılır.
 */
export class DoseService {
  /** Bu süre geçip onay yoksa doz kaçırılmış sayılır (#7 ile aynı kural). */
  private static readonly MISSED_AFTER_MS = 30 * 60 * 1000;

  private readonly storage: IStorage;
  private readonly snoozes: SnoozeCanceller;
  private readonly now: () => Date;

  constructor(storage: IStorage, snoozes: SnoozeCanceller, now: () => Date = () => new Date()) {
    this.storage = storage;
    this.snoozes = snoozes;
    this.now = now;
  }

  /** Belirleyici kimlik: aynı doz iki kez kaydedilemez, stok iki kez düşmez. */
  static doseLogId(medicationId: string, date: string, time: string) {
    return `${medicationId}_${date}_${time}`;
  }

  /** Ekranların kancaları için: `doseLogId` ile aynı kimlik. */
  logIdOf(medicationId: string, date: string, time: string) {
    return DoseService.doseLogId(medicationId, date, time);
  }

  isTaken(doseLogs: DoseLog[], medicationId: string, date: string, time: string) {
    const id = DoseService.doseLogId(medicationId, date, time);
    return doseLogs.some((log) => log.id === id);
  }

  /** `now` gününün dozlarını saate göre sıralı ve durumları hesaplanmış olarak döner. */
  getTodayDoses(medications: Medication[], doseLogs: DoseLog[], now: Date): Dose[] {
    return this.getDosesOn(now, medications, doseLogs, now);
  }

  /** Verilen günün dozları; o gün geçerli olan plana göre hesaplanır. */
  getDosesOn(day: Date, medications: Medication[], doseLogs: DoseLog[], now: Date): Dose[] {
    const logs = new Map(doseLogs.map((log) => [log.id, log]));
    return medications
      .flatMap((medication) => this.dosesOf(medication, day, logs, doseLogs, now))
      .sort(
        (a, b) =>
          a.time.localeCompare(b.time) ||
          a.medication.name.localeCompare(b.medication.name, 'tr-TR'),
      );
  }

  /** Bugünün alınan ve toplam doz sayısı; yarın başlayacak dozlar sayılmaz. */
  progressOf(doses: Dose[]) {
    const counted = doses.filter((dose) => dose.status !== 'yarin');
    const taken = counted.filter((dose) => dose.status === 'alindi').length;
    const remaining = counted.filter((dose) => dose.status === 'bekliyor').length;
    return {
      total: counted.length,
      taken,
      remaining,
      percent: counted.length === 0 ? 0 : Math.round((taken / counted.length) * 100),
    };
  }

  /** Dozları Sabah, Öğle, Akşam & Gece gruplarına ayırır; boş grup dönmez. */
  groupByPeriod(doses: Dose[]): DoseGroup[] {
    return DAY_PERIODS.map((period) => ({
      period,
      doses: doses.filter((dose) => dayPeriodOf(dose.time) === period),
    })).filter((group) => group.doses.length > 0);
  }

  /** Sıradaki doz: saate göre ilk bekleyen. */
  nextPending(doses: Dose[]): Dose | undefined {
    return doses.find((dose) => dose.status === 'bekliyor');
  }

  /**
   * Sade mod ana ekranında gösterilen tek doz: saati gelmiş ama alınmamış en son doz
   * (gecikmiş veya kaçırılmış); yoksa sıradaki bekleyen doz. Yeni bir dozun saati
   * gelince önceki kaçırılan doz ekrandan çekilir, Geçmiş'te kaçırıldı olarak kalır.
   * Dozlar `getTodayDoses` gibi saate göre sıralı olmalıdır.
   */
  focusDose(doses: Dose[], now: Date): Dose | undefined {
    const clock = formatTime(now.getHours(), now.getMinutes());
    const open = doses.filter((dose) => dose.status === 'bekliyor' || dose.status === 'kacirildi');
    const due = open.filter((dose) => dose.time <= clock);
    return due.at(-1) ?? open.find((dose) => dose.status === 'bekliyor');
  }

  /** Bu günden önce eklenmiş ilaç var mı? (Geçmiş'te daha geri gidilebilir mi) */
  hasHistoryBefore(day: Date, medications: Medication[]): boolean {
    return medications.some((medication) => new Date(medication.createdAt) < day);
  }

  /** Pazartesiden başlayan haftanın günleri ve uyum oranı. */
  getWeek(monday: Date, medications: Medication[], doseLogs: DoseLog[], now: Date): HistoryWeek {
    const days = Array.from({ length: 7 }, (_, offset): HistoryDay => {
      const day = addDays(monday, offset);
      const doses = this.getDosesOn(day, medications, doseLogs, now).filter(
        (dose) => dose.status !== 'yarin',
      );
      return { day, date: formatDate(day), doses, summary: this.summaryOf(doses) };
    });
    const all = days.flatMap(({ doses }) => doses);
    const taken = all.filter((dose) => dose.status === 'alindi').length;
    const missed = all.filter((dose) => dose.status === 'kacirildi').length;
    const settled = taken + missed;
    return {
      days,
      taken,
      missed,
      adherence: settled === 0 ? null : Math.round((taken / settled) * 100),
    };
  }

  /**
   * Dozu onaylar, stoğu ilacın formuna göre düşürür ve ikisini birlikte kaydeder.
   * Doz zaten onaylıysa veya ilaç yoksa hiçbir şey yazılmaz ve `null` döner.
   */
  async confirmDose(
    state: DoseState,
    medicationId: string,
    date: string,
    time: string,
  ): Promise<DoseState | null> {
    const medication = state.medications.find((item) => item.id === medicationId);
    if (!medication || this.isTaken(state.doseLogs, medicationId, date, time)) return null;

    const log: DoseLog = {
      id: DoseService.doseLogId(medicationId, date, time),
      medicationId,
      date,
      time,
      takenAt: this.now().toISOString(),
    };
    const next: DoseState = {
      doseLogs: [...state.doseLogs, log],
      medications: state.medications.map((item) =>
        item.id === medicationId ? this.withStockAfterDose(item) : item,
      ),
    };
    await this.storage.saveDoseConfirmation(next.medications, next.doseLogs);
    // Onay kaydedildi; ertelenmiş bildirim kaldırılamazsa bu onayı bozmaz.
    this.snoozes.cancelSnooze(medicationId, date, time).catch((error) => {
      logger.warn('Ertelenmiş bildirim kaldırılamadı:', error);
    });
    return next;
  }

  private withStockAfterDose(medication: Medication): Medication {
    // Çok biçimlilik: tablet doz kadar azalır, şurup/krem gibi formlar adet düşürmez.
    const form = getMedicationForm(medication.form);
    const stock = form.stockAfterDose(medication.stock, medication.amount);
    return { ...medication, stock };
  }

  private dosesOf(
    medication: Medication,
    day: Date,
    logs: Map<string, DoseLog>,
    doseLogs: DoseLog[],
    now: Date,
  ): Dose[] {
    const date = formatDate(day);
    const times = new Map<string, DoseStatus>();

    for (const { plan, from, until } of this.planPeriods(medication)) {
      if (!isScheduledOn(plan, day)) continue;
      for (const time of plan.times) {
        const at = atTime(day, time);
        if (at.getTime() < from || at.getTime() >= until) continue;
        times.set(time, this.statusOf(medication.id, date, time, at, logs, now));
      }
    }
    // İlaç eklendiği gün, eklenmeden önceki saatler kaçırılmış sayılmaz; takip sonra başlar.
    if (medication.pastPlans.length === 0 && date === formatDate(now)) {
      for (const time of isScheduledOn(medication, day) ? medication.times : []) {
        if (!times.has(time)) times.set(time, 'yarin');
      }
    }
    // Erken alınıp sonra planı değişen doz geçmişten kaybolmasın.
    for (const log of doseLogs) {
      if (log.medicationId === medication.id && log.date === date) times.set(log.time, 'alindi');
    }

    return [...times].map(([time, status]) => {
      const takenAt = logs.get(DoseService.doseLogId(medication.id, date, time))?.takenAt;
      return { medication, date, time, status, ...(takenAt && { takenAt }) };
    });
  }

  /** Eski planlar ve geçerli plan, birbirini izleyen aralıklar olarak. */
  private planPeriods(medication: Medication): PlanPeriod[] {
    const createdAt = new Date(medication.createdAt);
    createdAt.setSeconds(0, 0);
    let from = createdAt.getTime();

    const periods = medication.pastPlans.map((plan): PlanPeriod => {
      const period = { plan, from, until: Date.parse(plan.until) };
      from = period.until;
      return period;
    });
    return [...periods, { plan: medication, from, until: Number.POSITIVE_INFINITY }];
  }

  private statusOf(
    medicationId: string,
    date: string,
    time: string,
    scheduledAt: Date,
    logs: Map<string, DoseLog>,
    now: Date,
  ): DoseStatus {
    if (logs.has(DoseService.doseLogId(medicationId, date, time))) return 'alindi';
    if (now.getTime() > scheduledAt.getTime() + DoseService.MISSED_AFTER_MS) return 'kacirildi';
    return 'bekliyor';
  }

  private summaryOf(doses: Dose[]): DaySummary {
    const taken = doses.some((dose) => dose.status === 'alindi');
    const missed = doses.some((dose) => dose.status === 'kacirildi');
    const pending = doses.some((dose) => dose.status === 'bekliyor');
    if (missed) return taken || pending ? 'some' : 'none';
    return taken && !pending ? 'all' : 'open';
  }
}
