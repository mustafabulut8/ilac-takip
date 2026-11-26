import { doseLogIdOf, getMedicationForm, type DoseLog, type Medication } from '@/models';
import { logger } from '@/utils/logger';

import type { DoseCalculator } from './DoseCalculator';
import type { Clock, SnoozeCanceller } from './ports';
import type { DoseLogRepository } from './repositories';

/** Doz onayından sonra kaydedilen yeni durum. */
export type DoseState = {
  medications: Medication[];
  doseLogs: DoseLog[];
};

/**
 * Doz onayı: kaydı yazar, stoğu ilacın formuna göre düşürür ve ertelenmiş bildirimi
 * kaldırır. Durumun hesabı DoseCalculator'dadır.
 */
export class DoseService {
  private readonly doseLogs: DoseLogRepository;
  private readonly snoozes: SnoozeCanceller;
  private readonly doses: DoseCalculator;
  private readonly now: Clock;

  constructor(
    doseLogs: DoseLogRepository,
    snoozes: SnoozeCanceller,
    doses: DoseCalculator,
    now: Clock,
  ) {
    this.doseLogs = doseLogs;
    this.snoozes = snoozes;
    this.doses = doses;
    this.now = now;
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
    if (!medication || this.doses.isTaken(state.doseLogs, medicationId, date, time)) return null;

    const log: DoseLog = {
      id: doseLogIdOf(medicationId, date, time),
      medicationId,
      date,
      time,
      takenAt: this.now().toISOString(),
    };
    const updated = this.withStockAfterDose(medication);
    await this.doseLogs.recordDose(log, updated);
    const next: DoseState = {
      doseLogs: [...state.doseLogs, log],
      medications: state.medications.map((item) => (item.id === medicationId ? updated : item)),
    };
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
}
