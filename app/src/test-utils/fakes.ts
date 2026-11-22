import type { DoseLog, Medication } from '@/models';
import type { IStorage, KeyValueStore, StoredData } from '@/services/StorageService';

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

/** Servis testleri için IStorage'ın bellekteki sahtesi. */
export class FakeStorage implements IStorage {
  medications: Medication[] = [];
  doseLogs: DoseLog[] = [];
  saveCount = 0;
  failWrites = false;

  async load(): Promise<StoredData> {
    return { medications: this.medications, doseLogs: this.doseLogs, warnings: [] };
  }

  async saveMedications(medications: Medication[]) {
    this.write();
    this.medications = medications;
  }

  async saveDoseConfirmation(medications: Medication[], doseLogs: DoseLog[]) {
    this.write();
    this.medications = medications;
    this.doseLogs = doseLogs;
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
