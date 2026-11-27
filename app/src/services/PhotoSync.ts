import type { Medication } from '@/models';
import { logger } from '@/utils/logger';
import { photoPathFor } from '@/utils/photo';

import type { Clock } from './ports';
import type { PhotoStorageApi } from './remote-ports';

/** Telefondaki fotoğraf dosyasının tam adresi (gerçeği: `PhotoService.photoUri`). */
export type LocalPhotoFiles = { photoUri(fileName: string): string };

/**
 * İlaç fotoğrafının sunucuya gitmesi. Fotoğraf telefonda kaydedilirken zaten küçültülüp
 * sıkıştırılır (`PhotoService`); burada yalnızca yüklenir ve eskileri temizlenir.
 */
export class PhotoSync {
  private readonly storage: PhotoStorageApi;
  private readonly files: LocalPhotoFiles;
  private readonly now: Clock;

  constructor(storage: PhotoStorageApi, files: LocalPhotoFiles, now: Clock) {
    this.storage = storage;
    this.files = files;
    this.now = now;
  }

  /**
   * Fotoğrafı telefonda olup sunucuda yolu olmayan ilacın fotoğrafını yükler ve yolu
   * doldurulmuş ilacı döner. Fotoğraf değişince `MedicationService` yolu sıfırlar.
   */
  async ensureUploaded(medication: Medication, ownerId: string): Promise<Medication> {
    if (!medication.photoFile || medication.photoPath) return medication;
    const path = photoPathFor(ownerId, medication.id, this.now());
    await this.storage.upload(path, this.files.photoUri(medication.photoFile));
    return { ...medication, photoPath: path };
  }

  /** İlacın artık kullanılmayan fotoğraflarını siler; başaramazsa kayda yazar, durdurmaz. */
  async cleanUp(ownerId: string, medicationId: string, keepPath: string | null) {
    try {
      await this.storage.removeExcept(ownerId, medicationId, keepPath);
    } catch (error) {
      logger.warn('Eski ilaç fotoğrafı silinemedi:', error);
    }
  }
}

const URL_SECONDS = 3600;
/** Süresi dolmaya bu kadar kala adres yenilenir. */
const RENEW_BEFORE_MS = 5 * 60_000;

/**
 * Özel kovadaki fotoğrafların imzalı adresleri. Aynı fotoğraf için süre dolana kadar aynı
 * adres verilir; görüntünün kendisi `expo-image` diskinde yoluyla (cacheKey) saklanır.
 */
export class PhotoUrls {
  private readonly storage: Pick<PhotoStorageApi, 'signedUrl'>;
  private readonly now: Clock;
  private readonly cache = new Map<string, { url: string; expiresAt: number }>();

  constructor(storage: Pick<PhotoStorageApi, 'signedUrl'>, now: Clock) {
    this.storage = storage;
    this.now = now;
  }

  async urlFor(path: string): Promise<string> {
    const cached = this.cache.get(path);
    const now = this.now().getTime();
    if (cached && cached.expiresAt - RENEW_BEFORE_MS > now) return cached.url;
    const url = await this.storage.signedUrl(path, URL_SECONDS);
    this.cache.set(path, { url, expiresAt: now + URL_SECONDS * 1000 });
    return url;
  }
}
