import type { DoseLog, Medication } from '@/models';
import type { KeyValueStore } from '@/services/local/LocalDeviceStore';
import type { StoredData } from '@/services/MedicationService';
import type { DoseLogRepository, MedicationRepository } from '@/services/repositories';

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
    ...overrides,
  };
}
