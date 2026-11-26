import type { Medication } from '@/models';

/**
 * Servislerin dış dünyadan beklediği küçük arayüzler (bağımlılığın tersine çevrilmesi).
 * Servis somut sınıfı değil bu arayüzleri bilir; gerçek uygulamaları `services/index.ts`
 * bağlar, testler sahtesini verir. Her arayüzün en az iki uygulaması vardır: gerçek ve sahte.
 */

/** Şu anki zaman. Testte sabit bir an verilir; böylece "kaçırıldı" gibi kurallar denenebilir. */
export type Clock = () => Date;

/** Gerçek saat; yalnızca composition root'ta verilir. */
export const systemClock: Clock = () => new Date();

/** İlaç değişince hatırlatmaları eşitleyen taraf (gerçeği: NotificationService). */
export interface ReminderScheduler {
  sync(medications: Medication[]): Promise<void>;
  cancelMedication(medication: Medication): Promise<void>;
}

/** Doz onaylanınca ertelenmiş bildirimi kaldıran taraf (gerçeği: NotificationService). */
export interface SnoozeCanceller {
  cancelSnooze(medicationId: string, date: string, time: string): Promise<void>;
}

/** İlaç fotoğraflarını kalıcı klasörde tutan taraf (gerçeği: PhotoService). */
export interface PhotoStore {
  savePhoto(sourceUri: string, baseName: string): Promise<string>;
  deletePhoto(fileName: string): void;
}
