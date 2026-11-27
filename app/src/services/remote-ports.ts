import type { DoseLog } from '@/models';
import type { MedicationRow } from '@/validation/medication-rows';

/**
 * Sunucudaki `medications` tablosunun repository'nin kullandığı kısmı. Gerçeği
 * `remote/SupabaseMedicationRows` (Supabase sorguları), testte `FakeMedicationRows`.
 * Satırlar ham döner; denetim `validation/medication-rows.ts`'dedir.
 */
export interface MedicationRowsApi {
  /** Kişinin silinmemiş ilaçları. */
  list(ownerId: string): Promise<unknown[]>;
  /**
   * Satırı ekler veya günceller. Sunucu yazmayı atladıysa (eski sürüm veya yetki yok)
   * `false` döner; hata fırlatmaz.
   */
  write(row: MedicationRow): Promise<boolean>;
  /** Yumuşak silme (`deleted_at`); atlandıysa `false`. */
  softDelete(id: string, at: string): Promise<boolean>;
  /** Tek satır (silinmiş olsa da); görünmüyorsa `null`. */
  fetch(id: string): Promise<unknown>;
}

/** Sunucuda kim, neyi, hangi sürümüyle aldı: "telefona ulaştı" işareti için. */
export type DeliveredItem = { id: string; server_updated_at: string };

/** Eşitlemenin sunucudan kullandığı kısım (gerçeği: `remote/SupabaseMedicationRows`). */
export interface SyncApi {
  /**
   * `cursor`'dan (sunucu zamanı, `server_updated_at`) sonra değişen ilaçlar, silinenler
   * dahil, eskiden yeniye. İmleç metin olarak saklanır: mikro saniye hassasiyeti
   * JavaScript `Date`'e çevrilince kaybolur ve aynı değişiklik yeniden gelirdi.
   */
  changedSince(ownerId: string, cursor: string | null): Promise<unknown[]>;
  /** İlaçların bu sürümünün telefona ulaştığını yazar (`mark_delivered`). */
  markDelivered(items: DeliveredItem[]): Promise<void>;
  /** Doz onayı; sunucu stoğu `amount` kadar düşürür, aynı doz iki kez düşürmez. */
  recordDose(log: DoseLog, amount: number): Promise<void>;
}
