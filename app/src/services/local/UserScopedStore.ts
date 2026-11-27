import { StorageError } from '@/errors';
import { logger } from '@/utils/logger';

import type { KeyValueStore } from './LocalDeviceStore';

/**
 * Oturum öncesinden kalan, kullanıcıya bağlı olmayan anahtarlar. İlk giren kullanıcıya bir
 * kez taşınır (schemaVersion 4 göçü, ADR-027).
 */
const LEGACY_KEYS = [
  'medications',
  'doseLogs',
  'schemaVersion',
  'outbox',
  'syncState',
  'healthConsent',
] as const;
/** Kullanıcının kendi verisi varsa eski veri onun üzerine yazılmaz. */
const DATA_KEYS = ['medications', 'doseLogs'] as const;

/** Kullanıcının anahtar öneki: `u:<kimlik>:medications` gibi. */
export function scopedKey(userId: string, key: string) {
  return `u:${userId}:${key}`;
}

/**
 * Yerel depoyu kullanıcıya göre ayırır (Decorator). Bütün anahtarlar oturumdaki
 * kullanıcının önekini alır; bir kullanıcı diğerinin verisini hiçbir yoldan okuyamaz.
 * Oturum yokken okuma boş döner, yazma reddedilir. Veri silinmez: aynı kişi geri gelince
 * ilaçları ve geçmişi yerinde durur.
 */
export class UserScopedStore implements KeyValueStore {
  private readonly base: KeyValueStore;
  private userId: string | null = null;
  /** Her kullanıcı için eski verinin taşınması bir kez denenir. */
  private readonly adoptions = new Map<string, Promise<void>>();

  constructor(base: KeyValueStore) {
    this.base = base;
  }

  setUser(userId: string | null) {
    this.userId = userId;
  }

  async getItem(key: string) {
    const userId = await this.ready();
    return userId ? this.base.getItem(scopedKey(userId, key)) : null;
  }

  async setItem(key: string, value: string) {
    const userId = await this.requireUser();
    return this.base.setItem(scopedKey(userId, key), value);
  }

  async multiSet(pairs: [string, string][]) {
    const userId = await this.requireUser();
    return this.base.multiSet(pairs.map(([key, value]) => [scopedKey(userId, key), value]));
  }

  async multiRemove(keys: string[]) {
    const userId = await this.ready();
    if (userId) await this.base.multiRemove(keys.map((key) => scopedKey(userId, key)));
  }

  private async requireUser() {
    const userId = await this.ready();
    if (!userId) {
      throw new StorageError(
        'Oturum yokken yerel depoya yazılamaz',
        'Bilgiler kaydedilemedi. Lütfen yeniden giriş yapın.',
      );
    }
    return userId;
  }

  /** Oturumdaki kullanıcı; ilk erişimde eski veri ona taşınmış olur. */
  private async ready() {
    const userId = this.userId;
    if (!userId) return null;
    let adoption = this.adoptions.get(userId);
    if (!adoption) {
      adoption = this.adoptLegacy(userId).catch((error) => {
        // Başarısız taşıma sonraki erişimde yeniden denenir.
        this.adoptions.delete(userId);
        throw error;
      });
      this.adoptions.set(userId, adoption);
    }
    await adoption;
    return userId;
  }

  private async adoptLegacy(userId: string) {
    const legacy = await Promise.all(LEGACY_KEYS.map((key) => this.base.getItem(key)));
    if (legacy.every((value) => value === null)) return;
    const own = await Promise.all(
      DATA_KEYS.map((key) => this.base.getItem(scopedKey(userId, key))),
    );
    if (own.some((value) => value !== null)) {
      logger.warn('Oturum öncesi veri taşınmadı: kullanıcının kendi verisi var.');
      return;
    }
    const pairs = LEGACY_KEYS.flatMap((key, index): [string, string][] => {
      const value = legacy[index];
      return value === null || value === undefined ? [] : [[scopedKey(userId, key), value]];
    });
    // Önce kopyalanır, sonra eski anahtarlar silinir: yarıda kalırsa veri kaybolmaz.
    await this.base.multiSet(pairs);
    await this.base.multiRemove([...LEGACY_KEYS]);
    logger.info('Oturum öncesi yerel veri ilk giren kullanıcıya taşındı.');
  }
}
