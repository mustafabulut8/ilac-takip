import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageError } from '@/errors';
import type { Database } from '@/types/database';

import type { ConsentApi } from '../ConsentService';

type Backend = Pick<SupabaseClient<Database>, 'rpc' | 'storage' | 'auth'>;

const PHOTO_BUCKET = 'medication-photos';
const FAILED = 'İşlem tamamlanamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';

/** Rıza RPC'leri ve kişinin fotoğraf klasörü (Adapter). RLS testleriyle denetlenir. */
export class SupabaseConsentApi implements ConsentApi {
  private readonly db: Backend;

  constructor(db: Backend) {
    this.db = db;
  }

  async grant(textVersion: string) {
    const { error } = await this.db.rpc('grant_health_consent', { p_text_version: textVersion });
    if (error) throw new StorageError(`Rıza kaydedilemedi: ${error.message}`, FAILED);
  }

  async withdraw() {
    const { error } = await this.db.rpc('withdraw_health_consent');
    if (error) throw new StorageError(`Rıza geri alınamadı: ${error.message}`, FAILED);
  }

  /** Fotoğraflar `<kişi kimliği>/` klasöründedir; klasördeki bütün dosyalar silinir. */
  async removeOwnPhotos() {
    const { data } = await this.db.auth.getSession();
    const ownerId = data.session?.user.id;
    if (!ownerId) throw new StorageError('Oturum yok; fotoğraflar silinemedi', FAILED);
    const bucket = this.db.storage.from(PHOTO_BUCKET);
    const listed = await bucket.list(ownerId, { limit: 1000 });
    if (listed.error)
      throw new StorageError(`Fotoğraflar listelenemedi: ${listed.error.message}`, FAILED);
    if (listed.data.length === 0) return;
    const removed = await bucket.remove(listed.data.map((file) => `${ownerId}/${file.name}`));
    if (removed.error)
      throw new StorageError(`Fotoğraflar silinemedi: ${removed.error.message}`, FAILED);
  }
}
