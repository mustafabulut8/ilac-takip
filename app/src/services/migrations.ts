import { DEFAULT_FORM_KIND } from '@/models';
import { isRecord } from '@/utils/json';

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
];

export const CURRENT_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** `fromVersion`'dan sonraki tüm göçleri sırayla uygular. */
export function runMigrations(data: RawStoredData, fromVersion: number): RawStoredData {
  return MIGRATIONS.filter((migration) => migration.version > fromVersion).reduce(
    (current, migration) => migration.migrate(current),
    data,
  );
}
