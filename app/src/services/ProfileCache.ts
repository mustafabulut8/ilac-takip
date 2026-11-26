import type { Profile } from '@/models';
import { logger } from '@/utils/logger';
import { parseCachedProfile } from '@/validation/profile-records';

/** Profilin cihazdaki kopyası için anahtar-değer deposu (AsyncStorage). */
export interface ProfileCacheStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Profilin (ad ve rol) cihazdaki kopyası. İnternet yokken uygulama bu kopyayla doğru
 * ana ekranı açar. Okuma ve yazma hataları işlemi durdurmaz; yalnızca kayda yazılır.
 */
export class ProfileCache {
  static readonly KEY = 'profile';

  private readonly store: ProfileCacheStore;

  constructor(store: ProfileCacheStore) {
    this.store = store;
  }

  /** Aynı kullanıcının kayıtlı profili; yoksa, bozuksa veya okunamazsa null. */
  async read(userId: string): Promise<Profile | null> {
    try {
      return parseCachedProfile(await this.store.getItem(ProfileCache.KEY), userId);
    } catch (error) {
      logger.warn('Cihazdaki profil okunamadı:', error);
      return null;
    }
  }

  async save(profile: Profile) {
    try {
      await this.store.setItem(ProfileCache.KEY, JSON.stringify(profile));
    } catch (error) {
      // Kopya yazılamazsa yalnızca çevrimdışı açılış etkilenir; işlem durmaz.
      logger.warn('Profil cihaza yazılamadı:', error);
    }
  }

  async clear() {
    try {
      await this.store.removeItem(ProfileCache.KEY);
    } catch (error) {
      logger.warn('Cihazdaki profil silinemedi:', error);
    }
  }
}
