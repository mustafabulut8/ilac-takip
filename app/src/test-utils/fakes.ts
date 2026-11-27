import type { DoseLog, Medication } from '@/models';
import type { KeyValueStore } from '@/services/local/LocalDeviceStore';
import type { StoredData } from '@/services/MedicationService';
import type { NotificationsApi } from '@/services/NotificationService';
import type { DoseLogRepository, MedicationRepository } from '@/services/repositories';
import type { MedicationRowsApi, SyncApi } from '@/services/remote-ports';
import type { MedicationRow } from '@/validation/medication-rows';

/** AsyncStorage yerine bellekte çalışan sahte anahtar-değer deposu. */
export class MemoryKeyValueStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  failReads = false;
  failWrites = false;
  multiSetCalls = 0;

  constructor(initial: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initial)) this.data.set(key, value);
  }

  async getItem(key: string) {
    if (this.failReads) throw new Error('okuma hatası');
    return this.data.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('yazma hatası');
    this.data.set(key, value);
  }

  async multiSet(pairs: [string, string][]) {
    if (this.failWrites) throw new Error('yazma hatası');
    this.multiSetCalls += 1;
    for (const [key, value] of pairs) this.data.set(key, value);
  }

  async multiRemove(keys: string[]) {
    if (this.failWrites) throw new Error('yazma hatası');
    for (const key of keys) this.data.delete(key);
  }

  keys() {
    return [...this.data.keys()];
  }
}

/**
 * Servis testleri için iki repository'nin bellekteki sahtesi. Listeler tek yerde tutulur;
 * testler `medications`, `doseLogs` ve yazma sayısını doğrudan denetler.
 */
export class FakeStorage {
  medications: Medication[] = [];
  doseLogs: DoseLog[] = [];
  saveCount = 0;
  failWrites = false;

  readonly medicationRepository: MedicationRepository = {
    load: async () => ({ items: this.medications, warnings: [] }),
    add: async (medication) => {
      this.write();
      this.medications = [...this.medications, medication];
    },
    update: async (medication) => {
      this.write();
      this.medications = this.medications.map((item) =>
        item.id === medication.id ? medication : item,
      );
    },
    remove: async (id) => {
      this.write();
      this.medications = this.medications.filter((item) => item.id !== id);
    },
  };

  readonly doseLogRepository: DoseLogRepository = {
    load: async () => ({ items: this.doseLogs, warnings: [] }),
    recordDose: async (log, medication) => {
      this.write();
      this.medications = this.medications.map((item) =>
        item.id === medication.id ? medication : item,
      );
      this.doseLogs = [...this.doseLogs, log];
    },
  };

  /** İki repository birlikte: `MedicationService`'in istediği biçim. */
  get repositories() {
    return { medications: this.medicationRepository, doseLogs: this.doseLogRepository };
  }

  /** Açılıştaki okuma; kanca testlerindeki sahte `load` için. */
  async load(): Promise<StoredData> {
    return { medications: this.medications, doseLogs: this.doseLogs, warnings: [] };
  }

  private write() {
    if (this.failWrites) throw new Error('yazma hatası');
    this.saveCount += 1;
  }
}

export function makeMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'ilac1',
    name: 'Aspirin',
    dose: '1 tablet',
    photoFile: 'ilac1.jpg',
    times: ['08:00', '20:00'],
    stock: 10,
    createdAt: new Date(2026, 0, 1, 0, 0).toISOString(),
    form: 'tablet',
    amount: 1,
    unit: 'adet',
    location: '',
    schedule: { kind: 'daily' },
    duration: { kind: 'continuous' },
    startDate: '2026-01-01',
    mealTiming: 'any',
    lowStockThreshold: 5,
    markedLow: false,
    pastPlans: [],
    updatedAt: new Date(2026, 0, 1, 0, 0).toISOString(),
    photoPath: '',
    ...overrides,
  };
}

type Row = Record<string, unknown> & { id: string };

/**
 * Sunucudaki `medications` tablosunun sahtesi. Veritabanı tetikleyicisindeki "son yazan
 * kazanır" kuralını taklit eder: `updated_at`'i mevcut satırdan eski olan yazma atlanır.
 */
export class FakeMedicationRows implements MedicationRowsApi, SyncApi {
  readonly rows = new Map<string, Row>();
  /** Bu kimliklere yazma RLS'e takılmış gibi atlanır ve satır görünmez. */
  readonly rejectWritesFor = new Set<string>();
  readonly delivered: { id: string; server_updated_at: string }[][] = [];
  readonly doses: { log: DoseLog; amount: number }[] = [];
  readonly cursors: (string | null)[] = [];
  /** true iken her istek ağ hatası verir. */
  offline = false;
  private tick = 0;

  /** Sunucu saati: mikro saniyeli, karşılaştırılabilir metin (Postgres biçimi gibi). */
  private serverNow() {
    this.tick += 1;
    return `2026-11-27T09:00:00.${String(this.tick).padStart(6, '0')}+00:00`;
  }

  /** Aile üyesinin yazması: "telefona ulaştı" boş kalır. */
  familyWrite(row: Record<string, unknown>) {
    const existing = this.rows.get(String(row.id));
    this.put({ ...existing, ...row, server_updated_at: this.serverNow(), delivered_at: null });
  }

  put(row: Record<string, unknown>) {
    const id = String(row.id);
    this.rows.set(id, { server_updated_at: this.serverNow(), ...row, id });
  }

  get(id: string) {
    return this.rows.get(id);
  }

  async list(ownerId: string) {
    return [...this.rows.values()].filter(
      (row) => row.owner_id === ownerId && row.deleted_at === null,
    );
  }

  async write(row: MedicationRow) {
    this.assertOnline();
    if (this.rejectWritesFor.has(row.id)) return false;
    const existing = this.rows.get(row.id);
    if (existing && Date.parse(row.updated_at) < Date.parse(String(existing.updated_at))) {
      return false;
    }
    this.rows.set(row.id, {
      ...existing,
      ...row,
      server_updated_at: this.serverNow(),
      delivered_at: 'sahip-yazdi',
    });
    return true;
  }

  async changedSince(ownerId: string, cursor: string | null) {
    this.assertOnline();
    this.cursors.push(cursor);
    return [...this.rows.values()]
      .filter((row) => row.owner_id === ownerId)
      .filter((row) => cursor === null || String(row.server_updated_at) > cursor)
      .sort((x, y) => String(x.server_updated_at).localeCompare(String(y.server_updated_at)));
  }

  async markDelivered(items: { id: string; server_updated_at: string }[]) {
    this.delivered.push(items);
  }

  async recordDose(log: DoseLog, amount: number) {
    this.assertOnline();
    this.doses.push({ log, amount });
  }

  private assertOnline() {
    if (this.offline) throw new Error('ağ hatası');
  }

  async softDelete(id: string, at: string) {
    const existing = this.rows.get(id);
    if (!existing || Date.parse(at) < Date.parse(String(existing.updated_at))) return false;
    this.rows.set(id, {
      ...existing,
      deleted_at: at,
      updated_at: at,
      server_updated_at: this.serverNow(),
    });
    return true;
  }

  async fetch(id: string) {
    if (this.rejectWritesFor.has(id)) return null;
    return this.rows.get(id) ?? null;
  }
}

/** Kurulan bildirimleri gerçekten tutan cihaz sahtesi (gerçek NotificationService ile kullanılır). */
export function deviceNotifications(initial: string[] = []) {
  const pending = new Set(initial);
  const api = {
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
    getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    getAllScheduledNotificationsAsync: jest.fn(async () =>
      [...pending].map((identifier) => ({ identifier })),
    ),
    scheduleNotificationAsync: jest.fn(async ({ identifier }: { identifier: string }) => {
      pending.add(identifier);
      return identifier;
    }),
    cancelScheduledNotificationAsync: jest.fn(async (identifier: string) => {
      pending.delete(identifier);
    }),
  };
  return { api: api as unknown as NotificationsApi, pending };
}
