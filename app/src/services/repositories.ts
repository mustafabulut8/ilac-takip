import type { DoseLog, Medication } from '@/models';

/** Okunan kayıtlar ve kullanıcıya gösterilecek Türkçe uyarılar (bozuk veri gibi). */
export type Loaded<T> = {
  items: T[];
  warnings: string[];
};

/**
 * İlaç kayıtlarının deposu (Repository deseni). Servisler yalnızca bu arayüzü bilir.
 * Bugün cihaz deposu (`LocalMedicationRepository`) uygular; 2. parçada sunucu deposu
 * aynı arayüzü uygulayacak. Bu yüzden burada hiçbir depolama ayrıntısı yoktur.
 */
export interface MedicationRepository {
  load(): Promise<Loaded<Medication>>;
  add(medication: Medication): Promise<void>;
  update(medication: Medication): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Doz onaylarının deposu. Yalnızca alınan dozlar kaydedilir (kararlar.md, ADR-012). */
export interface DoseLogRepository {
  load(): Promise<Loaded<DoseLog>>;
  /**
   * Doz kaydını ve ilacın düşen stoğunu tek işlemde yazar: ya ikisi birden kaydedilir
   * ya hiçbiri. Biri yazılıp diğeri kaybolursa stok ile geçmiş birbirini tutmaz.
   */
  recordDose(log: DoseLog, medication: Medication): Promise<void>;
}
