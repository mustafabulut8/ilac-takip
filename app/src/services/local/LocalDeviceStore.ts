import { StorageError } from '@/errors';
import type { DoseLog, Medication } from '@/models';
import { logger } from '@/utils/logger';
import { safeJsonParse } from '@/utils/json';
import { parseDoseLogRecord, parseMedicationRecord } from '@/validation/stored-records';

import { CURRENT_SCHEMA_VERSION, runMigrations, type RawStoredData } from '../migrations';
import type { Clock } from '../ports';
import type { Loaded } from '../repositories';

/** Cihazdaki iki listenin okunmuş hali; her listenin uyarıları kendisiyle gelir. */
export type DeviceData = {
  medications: Loaded<Medication>;
  doseLogs: Loaded<DoseLog>;
};

/** AsyncStorage'ın kullandığımız kısmı. Testlerde bellekte çalışan sahte nesne verilir. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  multiSet(pairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

type ListResult<T> = { items: T[]; warning?: string };

function warningsOf(...results: ListResult<unknown>[]): string[] {
  return results.map((result) => result.warning).filter((warning): warning is string => !!warning);
}

/** Telefondaki mevcut anahtarlar; değiştirilirse kullanıcının ilaçları kaybolur. */
const KEYS = {
  medications: 'medications',
  doseLogs: 'doseLogs',
  schemaVersion: 'schemaVersion',
} as const;

const READ_FAILED_MESSAGE =
  'Kayıtlı veriler telefondan okunamadı. Verilerinizin üzerine yazılmaması için yeni kayıt kapatıldı. Lütfen uygulamayı kapatıp yeniden açın.';

/**
 * Cihaz deposu (AsyncStorage üzerine Adapter). İki repository bunu paylaşır; çünkü
 * göç iki listeyi birlikte yükseltir ve doz onayı iki anahtarı tek seferde yazar.
 * Okunan ve yazılan son liste bellekte tutulur; tek kayıtlık değişiklikler onun
 * üzerine uygulanıp bütün liste yazılır.
 */
export class LocalDeviceStore {
  private readonly store: KeyValueStore;
  private readonly now: Clock;
  /** Okuma tamamen başarısız olduysa bilinmeyen verinin üzerine yazılmaz. */
  private writable = true;
  /** Diskteki listelerin bellekteki kopyası; yalnızca başarılı okuma ve yazmadan sonra değişir. */
  private current: { medications: Medication[]; doseLogs: DoseLog[] } | null = null;
  /** İki repository aynı anda okursa disk bir kez okunur, bozuk veri bir kez yedeklenir. */
  private reading: Promise<DeviceData> | null = null;
  /** `reset` her çağrıldığında artar; önceki hesabın yarım kalan okuması bellek kopyasını değiştirmez. */
  private generation = 0;

  constructor(store: KeyValueStore, now: Clock) {
    this.store = store;
    this.now = now;
  }

  /** Hesap değişince bellekteki kopya bırakılır; sonraki okuma yeni kullanıcının verisidir. */
  reset() {
    this.generation += 1;
    this.current = null;
    this.reading = null;
    this.writable = true;
  }

  read(): Promise<DeviceData> {
    this.reading ??= this.readFromDisk().finally(() => {
      this.reading = null;
    });
    return this.reading;
  }

  /** İlaç listesini değiştirip yazar. */
  async writeMedications(change: (medications: Medication[]) => Medication[]) {
    this.assertWritable();
    const { medications, doseLogs } = await this.snapshot();
    const next = change(medications);
    await this.write([[KEYS.medications, JSON.stringify(next)]]);
    this.current = { medications: next, doseLogs };
  }

  /** Doz kaydını ve ilacın yeni halini tek `multiSet` ile birlikte yazar. */
  async writeDose(log: DoseLog, medication: Medication) {
    this.assertWritable();
    const snapshot = await this.snapshot();
    const medications = snapshot.medications.map((item) =>
      item.id === medication.id ? medication : item,
    );
    const doseLogs = [...snapshot.doseLogs.filter((item) => item.id !== log.id), log];
    await this.write([
      [KEYS.medications, JSON.stringify(medications)],
      [KEYS.doseLogs, JSON.stringify(doseLogs)],
    ]);
    this.current = { medications, doseLogs };
  }

  /** Hiç okunmadan yazılırsa diskteki veri silinmesin diye önce okunur. */
  private async snapshot() {
    if (!this.current) await this.read();
    return this.current ?? { medications: [], doseLogs: [] };
  }

  private async readFromDisk(): Promise<DeviceData> {
    const generation = this.generation;
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

    const medicationWarnings = warningsOf(medicationsJson, medications);
    const doseLogWarnings = warningsOf(doseLogsJson, doseLogs);

    // Bozuk veri varsa göç sonucu diske yazılmaz; yedeği alınan ham veri olduğu gibi kalır.
    const clean = medicationWarnings.length === 0 && doseLogWarnings.length === 0;
    if (fromVersion < CURRENT_SCHEMA_VERSION && clean) {
      await this.writeMigrated(migrated);
    }

    if (generation === this.generation) {
      this.current = { medications: medications.items, doseLogs: doseLogs.items };
    }
    return {
      medications: { items: medications.items, warnings: medicationWarnings },
      doseLogs: { items: doseLogs.items, warnings: doseLogWarnings },
    };
  }

  /** Okuma başarısız olduysa yeniden okuyup göç yazmadan önce durulur. */
  private assertWritable() {
    if (!this.writable) {
      throw new StorageError('Okuma başarısız olduğu için yazma kapalı', READ_FAILED_MESSAGE);
    }
  }

  private async write(pairs: [string, string][]) {
    this.assertWritable();
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
