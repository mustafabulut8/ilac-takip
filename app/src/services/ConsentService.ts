import { z } from 'zod';

import { OfflineError } from '@/errors';
import { safeJsonParse } from '@/utils/json';

import type { KeyValueStore } from './local/LocalDeviceStore';
import type { Clock } from './ports';

/**
 * Sağlık verisi için açık rıza (KVKK, kararlar.md ADR-021). Rıza verilmeden ilaçlar
 * sunucuya gitmez ve aile bağlantısı kurulamaz; uygulama yalnızca telefonda çalışır.
 *
 * Bu sınıf telefondaki ilaç deposunu ve bildirimleri bilmez. Rızayı geri almak bu
 * yüzden yalnızca sunucudaki veriyi ve eşitleme kayıtlarını siler; telefondaki ilaçlar,
 * doz geçmişi ve hatırlatmalar olduğu gibi kalır.
 */

/** Sunucudaki rıza işlemleri (gerçeği: `remote/SupabaseConsentApi`). */
export interface ConsentApi {
  grant(textVersion: string): Promise<void>;
  /** Kişinin klasöründeki fotoğraflar (Storage API ile; SQL bunları silemez). */
  removeOwnPhotos(): Promise<void>;
  /** Sunucudaki ilaç, doz, telefon durumu, davet kodu ve aile bağlantılarını siler. */
  withdraw(): Promise<void>;
}

/** Telefonun internete bağlı olup olmadığı (gerçeği: expo-network). */
export interface NetworkStatus {
  isOnline(): Promise<boolean>;
}

/** Eşitlemeyi durdurup başlatan taraf (gerçeği: SyncService). */
export interface SyncSwitch {
  /** Çalışan eşitlemenin bitmesini bekler ve yenisini başlatmaz. */
  stop(): Promise<void>;
  start(): void;
}

type ConsentStatus = 'granted' | 'declined' | 'withdrawn' | 'none';
export type ConsentState = { status: ConsentStatus; at: string | null };

/** Eşitlemeye ait anahtarlar; geri almada silinir. İlaç anahtarlarına dokunulmaz. */
const SYNC_KEYS = ['outbox', 'syncState'];
const CONSENT_KEY = 'healthConsent';

const storedConsentSchema = z.object({
  userId: z.string(),
  status: z.enum(['granted', 'declined', 'withdrawn']),
  at: z.string(),
  textVersion: z.string().catch(''),
});

const NO_CONSENT: ConsentState = { status: 'none', at: null };

export class ConsentService {
  private readonly api: ConsentApi;
  private readonly store: KeyValueStore;
  private readonly sync: SyncSwitch;
  private readonly network: NetworkStatus;
  private readonly now: Clock;

  constructor(
    api: ConsentApi,
    store: KeyValueStore,
    sync: SyncSwitch,
    network: NetworkStatus,
    now: Clock,
  ) {
    this.api = api;
    this.store = store;
    this.sync = sync;
    this.network = network;
    this.now = now;
  }

  /** Telefondaki rıza kaydı; çevrimdışı açılışta da okunur. Başka hesabın kaydı sayılmaz. */
  async current(userId: string): Promise<ConsentState> {
    const parsed = safeJsonParse((await this.store.getItem(CONSENT_KEY)) ?? '');
    const result = storedConsentSchema.safeParse(parsed.ok ? parsed.value : null);
    if (!result.success || result.data.userId !== userId) return NO_CONSENT;
    return { status: result.data.status, at: result.data.at };
  }

  async grant(userId: string, textVersion: string): Promise<void> {
    await this.requireOnline('rıza verme');
    await this.api.grant(textVersion);
    await this.save(userId, 'granted', textVersion);
    this.sync.start();
  }

  /** "Şimdilik hayır": yalnızca telefona yazılır, soru bir daha kendiliğinden gelmez. */
  decline(userId: string) {
    return this.save(userId, 'declined', '');
  }

  /**
   * Sıra önemlidir: önce eşitleme durur (silinen veri yeniden gönderilmesin), sonra
   * fotoğraflar ve sunucu verisi silinir. Sunucu hatasında rıza verilmiş kalır ve
   * eşitleme yeniden başlar; kullanıcı tekrar deneyebilir.
   */
  async withdraw(userId: string): Promise<void> {
    await this.requireOnline('rızayı geri alma');
    await this.sync.stop();
    try {
      await this.api.removeOwnPhotos();
      await this.api.withdraw();
    } catch (error) {
      this.sync.start();
      throw error;
    }
    await this.store.multiRemove(SYNC_KEYS);
    await this.save(userId, 'withdrawn', '');
  }

  private async requireOnline(action: string) {
    if (!(await this.network.isOnline())) throw new OfflineError(action);
  }

  private save(userId: string, status: Exclude<ConsentStatus, 'none'>, textVersion: string) {
    const record = { userId, status, at: this.now().toISOString(), textVersion };
    return this.store.setItem(CONSENT_KEY, JSON.stringify(record));
  }
}
