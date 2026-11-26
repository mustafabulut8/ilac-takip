import { makeMedication, MemoryKeyValueStore } from '@/test-utils/fakes';

import { DoseCalculator } from '../DoseCalculator';
import { HistoryService } from '../HistoryService';
import { AsyncStorageService } from '../StorageService';

const NOW = new Date(2026, 10, 16, 9, 0);
const history = new HistoryService(new DoseCalculator());

async function loadV1(medications: unknown[]) {
  const store = new MemoryKeyValueStore({
    medications: JSON.stringify(medications),
    schemaVersion: '1',
  });
  const data = await new AsyncStorageService(store, () => NOW).load();
  return { data, store };
}

describe('v1 → v2 göçü: bozuk ve eksik veri', () => {
  it('okunamayan kayıt anı en eski gün sayılır; Geçmiş’te geriye gidilebilir', async () => {
    const { data } = await loadV1([
      { id: 'm1', name: 'Aspirin', times: ['08:00'], stock: 3, createdAt: 'dün akşam' },
    ]);
    const [medication] = data.medications;
    expect(medication?.startDate).toBe('1970-01-01');
    expect(Number.isNaN(Date.parse(medication?.createdAt ?? ''))).toBe(false);
    expect(history.hasHistoryBefore(new Date(2026, 10, 16), data.medications)).toBe(true);
  });

  it('kayıt anı hiç yoksa da aynı kural geçer', async () => {
    const { data } = await loadV1([{ id: 'm1', name: 'Aspirin', times: ['08:00'] }]);
    expect(data.medications[0]).toMatchObject({
      createdAt: new Date(0).toISOString(),
      startDate: '1970-01-01',
      stock: 0,
      schedule: { kind: 'daily' },
      duration: { kind: 'continuous' },
    });
  });

  it('kimliği veya adı olmayan, nesne olmayan kayıtlar atlanır; sağlamlar kalır', async () => {
    const { data } = await loadV1([
      null,
      42,
      'metin',
      { name: 'Kimliksiz' },
      { id: 'adsiz' },
      makeMedication(),
    ]);
    expect(data.medications.map((item) => item.id)).toEqual(['ilac1']);
  });

  it('bozuk alanlar varsayılana döner, göç sonrası sürüm 2 yazılır', async () => {
    const { data, store } = await loadV1([
      {
        id: 'm1',
        name: 'Aspirin',
        times: ['8', '25:00', '08:00', '08:00'],
        schedule: { kind: 'weekdays', days: [9, 'pazartesi'] },
        duration: { kind: 'days', count: -3 },
        mealTiming: 'gece',
        amount: 0,
        createdAt: '2026-11-01T10:00:00.000Z',
      },
    ]);
    expect(data.medications[0]).toMatchObject({
      times: ['08:00'],
      schedule: { kind: 'daily' },
      duration: { kind: 'continuous' },
      mealTiming: 'any',
      form: 'tablet',
    });
    expect(store.data.get('schemaVersion')).toBe('2');
  });
});
