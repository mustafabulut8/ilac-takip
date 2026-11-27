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

/** Sunucudaki `dose_logs` tablosu (gerçeği: `remote/SupabaseDoseLogRows`). */
export interface DoseLogRowsApi {
  /** Kişinin `fromDate` (YYYY-MM-DD) gününden bu yana doz kayıtları. */
  list(ownerId: string, fromDate: string): Promise<unknown[]>;
}

/** Sunucudaki `medication-photos` kovası (gerçeği: `remote/SupabasePhotoStorage`). */
export interface PhotoStorageApi {
  /** Telefondaki dosyayı (`localUri`) verilen yola yükler. */
  upload(path: string, localUri: string): Promise<void>;
  /** İlacın `keepPath` dışındaki bütün fotoğraflarını siler (`null`: hepsini). */
  removeExcept(ownerId: string, medicationId: string, keepPath: string | null): Promise<void>;
  /** Özel kovadaki fotoğraf için süreli imzalı adres. */
  signedUrl(path: string, expiresInSeconds: number): Promise<string>;
}

/** Telefon durumu satırı (`device_status`). */
export type DeviceStatusRow = {
  owner_id: string;
  reminders_until: string | null;
  last_synced_at: string;
};

/** `device_status` tablosu (gerçeği: `remote/SupabaseDeviceStatus`). */
export interface DeviceStatusApi {
  write(row: DeviceStatusRow): Promise<void>;
}

/** Aile tarafı: yakının telefonundaki hatırlatmalar ne zamana kadar kurulu (satır yoksa `null`). */
export interface DeviceStatusReader {
  remindersUntil(ownerId: string): Promise<string | null>;
}
