import {
  getMedicationForm,
  type Dose,
  type DoseLog,
  type DoseStatus,
  type Medication,
} from '@/models';
import { atTime, formatDate } from '@/utils/date';

import type { IStorage } from './StorageService';

/** Doz onayından sonra kaydedilen yeni durum. */
export type DoseState = {
  medications: Medication[];
  doseLogs: DoseLog[];
};

/**
 * Doz kimliği, günlük doz durumu, onay ve stok düşme kuralları.
 * Durum saklanmaz; yalnızca alınan dozlar `DoseLog` olarak yazılır.
 */
export class DoseService {
  /** Bu süre geçip onay yoksa doz kaçırılmış sayılır (#7 ile aynı kural). */
  private static readonly MISSED_AFTER_MS = 30 * 60 * 1000;

  private readonly storage: IStorage;
  private readonly now: () => Date;

  constructor(storage: IStorage, now: () => Date = () => new Date()) {
    this.storage = storage;
    this.now = now;
  }

  /** Belirleyici kimlik: aynı doz iki kez kaydedilemez, stok iki kez düşmez. */
  static doseLogId(medicationId: string, date: string, time: string) {
    return `${medicationId}_${date}_${time}`;
  }

  isTaken(doseLogs: DoseLog[], medicationId: string, date: string, time: string) {
    const id = DoseService.doseLogId(medicationId, date, time);
    return doseLogs.some((log) => log.id === id);
  }

  /** `now` gününün dozlarını saate göre sıralı ve durumları hesaplanmış olarak döner. */
  getTodayDoses(medications: Medication[], doseLogs: DoseLog[], now: Date): Dose[] {
    const date = formatDate(now);
    const takenIds = new Set(doseLogs.map((log) => log.id));

    return medications
      .flatMap((medication) =>
        medication.times.map((time) => ({
          medication,
          date,
          time,
          status: this.statusOf(medication, date, time, takenIds, now),
        })),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
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
    return next;
  }

  private withStockAfterDose(medication: Medication): Medication {
    // Çok biçimlilik: tablet bir azalır, şurup/krem gibi formlar adet düşürmez.
    const stock = getMedicationForm(medication.form).stockAfterDose(medication.stock);
    return { ...medication, stock };
  }

  private statusOf(
    medication: Medication,
    date: string,
    time: string,
    takenIds: Set<string>,
    now: Date,
  ): DoseStatus {
    const scheduledAt = atTime(now, time);
    const createdAt = new Date(medication.createdAt);
    createdAt.setSeconds(0, 0);

    // İlaç eklenmeden önceki saatler kaçırılmış sayılmaz; takip yarın başlar.
    if (scheduledAt < createdAt) return 'yarin';
    if (takenIds.has(DoseService.doseLogId(medication.id, date, time))) return 'alindi';
    if (now.getTime() > scheduledAt.getTime() + DoseService.MISSED_AFTER_MS) return 'kacirildi';
    return 'bekliyor';
  }
}
