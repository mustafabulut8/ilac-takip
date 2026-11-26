import {
  doseLogIdOf,
  type Dose,
  type DoseLog,
  type DosePlan,
  type DoseStatus,
  type Medication,
} from '@/models';
import { atTime, formatDate } from '@/utils/date';
import { isScheduledOn } from '@/utils/schedule';
import { DAY_PERIODS, dayPeriodOf, formatTime, type DayPeriod } from '@/utils/time';

export type DoseGroup = { period: DayPeriod; doses: Dose[] };

/** İlacın bir planının geçerli olduğu zaman aralığı: [from, until). */
type PlanPeriod = { plan: DosePlan; from: number; until: number };

/** Bir günün hesabında kullanılan ortak bilgiler. */
type DayContext = { day: Date; date: string; logs: Map<string, DoseLog>; now: Date };

/**
 * Doz durumunun hesabı: hangi gün hangi doz var, alındı mı, bekliyor mu, kaçırıldı mı.
 * Saf sınıftır; hiçbir şey kaydetmez. Durum saklanmaz, yalnızca alınan dozlar `DoseLog`
 * olarak yazılır (DoseService). Zaman her çağrıda `now` ile verilir.
 */
export class DoseCalculator {
  /** Bu süre geçip onay yoksa doz kaçırılmış sayılır (#7 ile aynı kural). */
  private static readonly MISSED_AFTER_MS = 30 * 60 * 1000;

  /** Ekranların kancaları için: kayıtlı onayın kimliği. */
  logIdOf(medicationId: string, date: string, time: string) {
    return doseLogIdOf(medicationId, date, time);
  }

  isTaken(doseLogs: DoseLog[], medicationId: string, date: string, time: string) {
    const id = doseLogIdOf(medicationId, date, time);
    return doseLogs.some((log) => log.id === id);
  }

  /** `now` gününün dozlarını saate göre sıralı ve durumları hesaplanmış olarak döner. */
  getTodayDoses(medications: Medication[], doseLogs: DoseLog[], now: Date): Dose[] {
    return this.getDosesOn(now, medications, doseLogs, now);
  }

  /** Verilen günün dozları; o gün geçerli olan plana göre hesaplanır. */
  getDosesOn(day: Date, medications: Medication[], doseLogs: DoseLog[], now: Date): Dose[] {
    const context: DayContext = {
      day,
      date: formatDate(day),
      logs: new Map(doseLogs.map((log) => [log.id, log])),
      now,
    };
    return medications
      .flatMap((medication) => this.dosesOf(medication, context, doseLogs))
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

  private dosesOf(medication: Medication, context: DayContext, doseLogs: DoseLog[]): Dose[] {
    const times = this.plannedStatuses(medication, context);
    this.markNotStartedYet(medication, context, times);
    // Erken alınıp sonra planı değişen doz geçmişten kaybolmasın.
    for (const log of doseLogs) {
      if (log.medicationId === medication.id && log.date === context.date) {
        times.set(log.time, 'alindi');
      }
    }
    return [...times].map(([time, status]) => {
      const takenAt = context.logs.get(doseLogIdOf(medication.id, context.date, time))?.takenAt;
      return { medication, date: context.date, time, status, ...(takenAt && { takenAt }) };
    });
  }

  /** O gün geçerli olan planların saatleri ve durumları. */
  private plannedStatuses(medication: Medication, context: DayContext) {
    const times = new Map<string, DoseStatus>();
    for (const { plan, from, until } of this.planPeriods(medication)) {
      if (!isScheduledOn(plan, context.day)) continue;
      for (const time of plan.times) {
        const at = atTime(context.day, time);
        if (at.getTime() < from || at.getTime() >= until) continue;
        times.set(time, this.statusOf(medication.id, time, at, context));
      }
    }
    return times;
  }

  /** İlaç eklendiği gün, eklenmeden önceki saatler kaçırılmış sayılmaz; takip sonra başlar. */
  private markNotStartedYet(
    medication: Medication,
    { day, date, now }: DayContext,
    times: Map<string, DoseStatus>,
  ) {
    if (medication.pastPlans.length > 0 || date !== formatDate(now)) return;
    if (!isScheduledOn(medication, day)) return;
    for (const time of medication.times) {
      if (!times.has(time)) times.set(time, 'yarin');
    }
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
    time: string,
    scheduledAt: Date,
    { date, logs, now }: DayContext,
  ): DoseStatus {
    if (logs.has(doseLogIdOf(medicationId, date, time))) return 'alindi';
    if (now.getTime() > scheduledAt.getTime() + DoseCalculator.MISSED_AFTER_MS) return 'kacirildi';
    return 'bekliyor';
  }
}
