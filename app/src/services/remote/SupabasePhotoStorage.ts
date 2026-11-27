import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageError } from '@/errors';
import type { Database } from '@/types/database';

import type { PhotoStorageApi } from '../remote-ports';

const BUCKET = 'medication-photos';

function fail(action: string, message: string): never {
  throw new StorageError(
    `İlaç fotoğrafı ${action}: ${message}`,
    'Fotoğraf gönderilemedi. İnternet bağlantınızı kontrol edin.',
  );
}

/**
 * Özel `medication-photos` kovası (Adapter). Erişim kuralları sunucudadır: sahip ve bağlı
 * aile görür; yükleme için sahibin rızası gerekir (RLS testleri).
 */
export class SupabasePhotoStorage implements PhotoStorageApi {
  private readonly db: Pick<SupabaseClient<Database>, 'storage'>;
  private readonly readBytes: (localUri: string) => Promise<ArrayBuffer>;

  /** `readBytes`: telefondaki dosyanın içeriği (uygulamada expo-file-system, testte sabit). */
  constructor(
    db: Pick<SupabaseClient<Database>, 'storage'>,
    readBytes: (localUri: string) => Promise<ArrayBuffer>,
  ) {
    this.db = db;
    this.readBytes = readBytes;
  }

  async upload(path: string, localUri: string) {
    const bytes = await this.readBytes(localUri);
    const { error } = await this.db.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) fail('yüklenemedi', error.message);
  }

  async removeExcept(ownerId: string, medicationId: string, keepPath: string | null) {
    const { data, error } = await this.db.storage
      .from(BUCKET)
      .list(ownerId, { search: `${medicationId}-` });
    if (error) fail('listelenemedi', error.message);
    const stale = data
      .map((item) => `${ownerId}/${item.name}`)
      .filter((path) => path.startsWith(`${ownerId}/${medicationId}-`) && path !== keepPath);
    if (stale.length === 0) return;
    const removed = await this.db.storage.from(BUCKET).remove(stale);
    if (removed.error) fail('silinemedi', removed.error.message);
  }

  async signedUrl(path: string, expiresInSeconds: number) {
    const { data, error } = await this.db.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresInSeconds);
    if (error) fail('adresi alınamadı', error.message);
    return data.signedUrl;
  }
}
