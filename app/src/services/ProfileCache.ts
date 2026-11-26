import { isUserRole, type Profile } from '@/models';
import { isRecord, safeJsonParse } from '@/utils/json';
import { logger } from '@/utils/logger';

/** Profilin cihazdaki kopyası için anahtar-değer deposu (AsyncStorage). */
export interface ProfileCacheStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Kayıtlı metni profile çevirir; bozuksa veya başka kullanıcınınsa null. */
function parseCachedProfile(raw: string | null, userId: string): Profile | null {
  const parsed = raw === null ? null : safeJsonParse(raw);
  if (!parsed?.ok || !isRecord(parsed.value)) return null;
  const { id, name, role, createdAt } = parsed.value;
  if (id !== userId || typeof name !== 'string' || !isUserRole(role)) return null;
  return { id, name, role, createdAt: typeof createdAt === 'string' ? createdAt : '' };
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
