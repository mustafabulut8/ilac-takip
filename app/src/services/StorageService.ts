import { StorageError } from '@/errors';
import type { DoseLog, Medication } from '@/models';
import { logger } from '@/utils/logger';
import { safeJsonParse } from '@/utils/json';
import { parseDoseLogRecord, parseMedicationRecord } from '@/validation/stored-records';

import { CURRENT_SCHEMA_VERSION, runMigrations, type RawStoredData } from './migrations';
import type { Clock } from './ports';

/** Açılışta okunan veri ve kullanıcıya gösterilecek Türkçe uyarılar. */
export type StoredData = {
  medications: Medication[];
  doseLogs: DoseLog[];
  warnings: string[];
};

/**
 * Kalıcı depolamanın soyutlaması. Servisler ve ekranlar yalnızca bu arayüzü bilir;
 * bugün AsyncStorage, ileride Supabase sınıfı aynı arayüzü uygulayacak.
 */
export interface IStorage {
  load(): Promise<StoredData>;
  saveMedications(medications: Medication[]): Promise<void>;
  /** Doz kaydı ve stok birlikte yazılır; biri yazılıp diğeri kaybolmasın. */
  saveDoseConfirmation(medications: Medication[], doseLogs: DoseLog[]): Promise<void>;
}

/** AsyncStorage'ın kullandığımız kısmı. Testlerde bellekte çalışan sahte nesne verilir. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  multiSet(pairs: [string, string][]): Promise<void>;
}

type ListResult<T> = { items: T[]; warning?: string };

/** Telefondaki mevcut anahtarlar; değiştirilirse kullanıcının ilaçları kaybolur. */
const KEYS = {
  medications: 'medications',
  doseLogs: 'doseLogs',
  schemaVersion: 'schemaVersion',
} as const;

const READ_FAILED_MESSAGE =
  'Kayıtlı veriler telefondan okunamadı. Verilerinizin üzerine yazılmaması için yeni kayıt kapatıldı. Lütfen uygulamayı kapatıp yeniden açın.';

export class AsyncStorageService implements IStorage {
  private readonly store: KeyValueStore;
  private readonly now: Clock;
  /** Okuma tamamen başarısız olduysa bilinmeyen verinin üzerine yazılmaz. */
  private writable = true;

  constructor(store: KeyValueStore, now: Clock) {
    this.store = store;
    this.now = now;
  }

  async load(): Promise<StoredData> {
    let raw: [string | null, string | null, string | null];
    try {
      raw = await Promise.all([
        this.store.getItem(KEYS.medications),
        this.store.getItem(KEYS.doseLogs),
        this.store.getItem(KEYS.schemaVersion),
      ]);
    } catch (error) {
      this.writable = false;
      throw new StorageError('Depolama okunamadı', READ_FAILED_MESSAGE, { cause: error });
    }
    const [medicationsText, doseLogsText, versionText] = raw;

    const medicationsJson = await this.parseArray(KEYS.medications, medicationsText);
    const doseLogsJson = await this.parseArray(KEYS.doseLogs, doseLogsText);
    const fromVersion = this.parseVersion(versionText);
    const migrated = runMigrations(
      { medications: medicationsJson.items, doseLogs: doseLogsJson.items },
      fromVersion,
    );

    const medications = await this.parseRecords(
      KEYS.medications,
      medicationsText,
      migrated.medications,
      parseMedicationRecord,
      (count) => `Kayıtlı ${count} ilaç okunamadı ve listeden çıkarıldı.`,
    );
    const doseLogs = await this.parseRecords(
      KEYS.doseLogs,
      doseLogsText,
      migrated.doseLogs,
      parseDoseLogRecord,
      (count) => `Kayıtlı ${count} doz onayı okunamadı.`,
    );

    const warnings = [medicationsJson, doseLogsJson, medications, doseLogs]
      .map((result) => result.warning)
      .filter((warning): warning is string => !!warning);

    // Bozuk veri varsa göç sonucu diske yazılmaz; yedeği alınan ham veri olduğu gibi kalır.
    if (fromVersion < CURRENT_SCHEMA_VERSION && warnings.length === 0) {
      await this.writeMigrated(migrated);
    }

    return { medications: medications.items, doseLogs: doseLogs.items, warnings };
  }

  async saveMedications(medications: Medication[]) {
    await this.write([[KEYS.medications, JSON.stringify(medications)]]);
  }

  async saveDoseConfirmation(medications: Medication[], doseLogs: DoseLog[]) {
    await this.write([
      [KEYS.medications, JSON.stringify(medications)],
      [KEYS.doseLogs, JSON.stringify(doseLogs)],
    ]);
  }

  private async write(pairs: [string, string][]) {
    if (!this.writable) {
      throw new StorageError('Okuma başarısız olduğu için yazma kapalı', READ_FAILED_MESSAGE);
    }
    try {
      await this.store.multiSet(pairs);
    } catch (error) {
      throw new StorageError(
        'AsyncStorage yazılamadı',
        'Bilgiler telefona kaydedilemedi. Lütfen tekrar deneyin.',
        { cause: error },
      );
    }
  }

  /** Metin JSON dizisi değilse ham hali yedeklenir ve boş liste döner. */
  private async parseArray(key: string, text: string | null): Promise<ListResult<unknown>> {
    if (text === null) return { items: [] };
    const parsed = safeJsonParse(text);
    if (parsed.ok && Array.isArray(parsed.value)) return { items: parsed.value };

    await this.backup(key, text);
    return {
      items: [],
      warning:
        key === KEYS.medications
          ? 'Kayıtlı ilaç listeniz okunamadı. Bozuk veri yedeklendi; lütfen ilaçlarınızı kontrol edin.'
          : 'Geçmiş doz kayıtlarınız okunamadı. Bozuk veri yedeklendi.',
    };
  }

  /** Dizideki her kaydı denetler; kullanılamayanlar atlanır ve ham veri yedeklenir. */
  private async parseRecords<T>(
    key: string,
    text: string | null,
    items: unknown[],
    parse: (value: unknown) => T | null,
    warningFor: (count: number) => string,
  ): Promise<ListResult<T>> {
    const valid = items.map(parse).filter((item): item is T => item !== null);
    const invalidCount = items.length - valid.length;
    if (invalidCount === 0 || text === null) return { items: valid };

    await this.backup(key, text);
    return { items: valid, warning: `${warningFor(invalidCount)} Bozuk veri yedeklendi.` };
  }

  /** Sürüm anahtarı yoksa veri v0 (sürüm numarası eklenmeden önceki biçim) sayılır. */
  private parseVersion(text: string | null): number {
    const version = Number(text);
    if (text === null || !Number.isInteger(version) || version < 0) return 0;
    if (version > CURRENT_SCHEMA_VERSION) {
      logger.warn(`Kayıtlı veri daha yeni bir sürümden (${version}); göç yapılmadı.`);
    }
    return version;
  }

  private async writeMigrated(data: RawStoredData) {
    try {
      await this.store.multiSet([
        [KEYS.medications, JSON.stringify(data.medications)],
        [KEYS.doseLogs, JSON.stringify(data.doseLogs)],
        [KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION)],
      ]);
    } catch (error) {
      // Göç bir sonraki açılışta yeniden denenir; bellekteki veri zaten güncel.
      logger.warn('Göç sonucu kaydedilemedi:', error);
    }
  }

  /** Bozuk ham veri silinmez; ayrı bir anahtara kopyalanır (örn. medications.yedek-1700000000000). */
  private async backup(key: string, text: string) {
    const backupKey = `${key}.yedek-${this.now().getTime()}`;
    try {
      await this.store.setItem(backupKey, text);
      logger.warn(`Bozuk veri yedeklendi: ${backupKey}`);
    } catch (error) {
      // Yedek alınamazsa üzerine yazmak veriyi yok eder; yazma kapatılır.
      this.writable = false;
      logger.error(`Bozuk veri yedeklenemedi: ${key}`, error);
    }
  }
}
