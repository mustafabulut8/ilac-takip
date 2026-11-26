import { DEFAULT_FORM_KIND, DEFAULT_LOW_STOCK_THRESHOLD } from '@/models';
import { isRecord } from '@/utils/json';
import { startDateOf } from '@/validation/stored-records';

/** Göç sırasında henüz denetlenmemiş ham veri. */
export type RawStoredData = {
  medications: unknown[];
  doseLogs: unknown[];
};

export type Migration = {
  /** Bu göç çalıştıktan sonra verinin ulaştığı sürüm. */
  version: number;
  description: string;
  migrate(data: RawStoredData): RawStoredData;
};

/**
 * Sürüm sırasına göre göçler. Yeni alan eklenirken eski kayıtlar burada yükseltilir.
 * Kural: var olan anahtar ve alan adları değiştirilmez, sadece yeni alan eklenir.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    description: 'Form alanı olmayan ilaçlar tablet sayılır.',
    migrate: (data) => ({
      ...data,
      medications: data.medications.map((item) =>
        isRecord(item) && item.form === undefined ? { ...item, form: DEFAULT_FORM_KIND } : item,
      ),
    }),
  },
  {
    version: 2,
    description:
      'Miktar, sıklık, süre, aç/tok ve stok uyarısı eklenir. Eski ilaçlar her gün ve süresizdir; her doz bir adet düşürür.',
    migrate: (data) => ({
      ...data,
      medications: data.medications.map((item) =>
        // Önce varsayılanlar: kayıtta olan hiçbir alanın üzerine yazılmaz.
        isRecord(item) ? { ...planDefaults(item.createdAt), ...item } : item,
      ),
    }),
  },
];

function planDefaults(createdAt: unknown) {
  return {
    amount: 1,
    unit: 'adet',
    location: '',
    schedule: { kind: 'daily' },
    duration: { kind: 'continuous' },
    startDate: startDateOf(createdAt),
    mealTiming: 'any',
    lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    markedLow: false,
    pastPlans: [],
  };
}

export const CURRENT_SCHEMA_VERSION = MIGRATIONS.at(-1)?.version ?? 0;

/** `fromVersion`'dan sonraki tüm göçleri sırayla uygular. */
export function runMigrations(data: RawStoredData, fromVersion: number): RawStoredData {
  return MIGRATIONS.filter((migration) => migration.version > fromVersion).reduce(
    (current, migration) => migration.migrate(current),
    data,
  );
}
