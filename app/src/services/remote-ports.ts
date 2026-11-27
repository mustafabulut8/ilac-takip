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
