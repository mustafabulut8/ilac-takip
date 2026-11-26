import { StorageError } from '@/errors';
import { makeMedication, MemoryKeyValueStore } from '@/test-utils/fakes';

import { CURRENT_SCHEMA_VERSION, MIGRATIONS, runMigrations } from '../migrations';
import { LocalDeviceStore } from '../local/LocalDeviceStore';
import { LocalDoseLogRepository } from '../local/LocalDoseLogRepository';
import { LocalMedicationRepository } from '../local/LocalMedicationRepository';

const NOW = new Date(2026, 10, 16, 9, 0);

/** v0.1-sprint1 sürümünün telefona yazdığı biçim: form alanı ve sürüm anahtarı yok. */
const legacyMedication = {
  id: 'm1',
  name: 'Aspirin',
  dose: '1 tablet',
  photoFile: 'm1.jpg',
  times: ['08:00', '20:00'],
  stock: 30,
  createdAt: '2026-11-01T10:00:00.000Z',
};
const legacyLog = {
  id: 'm1_2026-11-01_20:00',
  medicationId: 'm1',
  date: '2026-11-01',
  time: '20:00',
  takenAt: '2026-11-01T17:01:00.000Z',
};

/** Göçün eklediği alanlar; eski alanların hiçbiri değişmez. */
const migratedMedication = {
  ...legacyMedication,
  form: 'tablet',
  amount: 1,
  unit: 'adet',
  location: '',
  schedule: { kind: 'daily' },
  duration: { kind: 'continuous' },
  startDate: '2026-11-01',
  mealTiming: 'any',
  lowStockThreshold: 5,
  markedLow: false,
  pastPlans: [],
};

function setup(initial: Record<string, string> = {}) {
  const store = new MemoryKeyValueStore(initial);
  const device = new LocalDeviceStore(store, () => NOW);
  const medications = new LocalMedicationRepository(device);
  const doseLogs = new LocalDoseLogRepository(device);
  /** İki repository'yi açılıştaki gibi birlikte okur (MedicationService.load). */
  const load = async () => {
    const [meds, logs] = await Promise.all([medications.load(), doseLogs.load()]);
    return {
      medications: meds.items,
      doseLogs: logs.items,
      warnings: [...meds.warnings, ...logs.warnings],
    };
  };
  return { store, storage: { load }, medications, doseLogs };
}

describe('cihaz repository’leri: okuma ve göç', () => {
  it('ilk kurulumda boş liste döner, uyarı vermez', async () => {
    const { storage } = setup();
    expect(await storage.load()).toEqual({ medications: [], doseLogs: [], warnings: [] });
  });

  it('eski (v0) kaydı göç ettirir: yeni alanlar eklenir, diğer alanlar aynen kalır', async () => {
    const { store, storage } = setup({
      medications: JSON.stringify([legacyMedication]),
      doseLogs: JSON.stringify([legacyLog]),
    });

    const data = await storage.load();

    expect(data.warnings).toEqual([]);
    expect(data.medications).toEqual([migratedMedication]);
    expect(data.doseLogs).toEqual([legacyLog]);
    // Göç diske yazılır; anahtarlar aynı, sadece sürüm anahtarı eklenir.
    expect(store.keys().sort()).toEqual(['doseLogs', 'medications', 'schemaVersion']);
    expect(store.data.get('schemaVersion')).toBe(String(CURRENT_SCHEMA_VERSION));
    expect(JSON.parse(store.data.get('medications')!)).toEqual([migratedMedication]);
    expect(JSON.parse(store.data.get('doseLogs')!)).toEqual([legacyLog]);
  });

  it('v1 kaydını v2 ye göç ettirir, kayıtlı form ve alanlar korunur', async () => {
    const { store, storage } = setup({
      medications: JSON.stringify([{ ...legacyMedication, form: 'syrup', note: 'x' }]),
      doseLogs: JSON.stringify([legacyLog]),
      schemaVersion: '1',
    });
    const data = await storage.load();
    expect(data.medications).toEqual([{ ...migratedMedication, form: 'syrup', note: 'x' }]);
    expect(data.doseLogs).toEqual([legacyLog]);
    expect(store.data.get('schemaVersion')).toBe('2');
  });

  it('göç yeniden çalışsa da kullanıcının seçtiği planın üzerine yazmaz', async () => {
    const chosen = makeMedication({
      schedule: { kind: 'weekdays', days: [1] },
      amount: 0.5,
      stock: 9.5,
    });
    const { storage } = setup({ medications: JSON.stringify([chosen]) });
    expect((await storage.load()).medications).toEqual([chosen]);
  });

  it('güncel sürümdeki veriyi yeniden yazmaz', async () => {
    const { store, storage } = setup({
      medications: JSON.stringify([makeMedication()]),
      schemaVersion: String(CURRENT_SCHEMA_VERSION),
    });
    await storage.load();
    expect(store.multiSetCalls).toBe(0);
  });

  it('kayıtlı form korunur, üzerine tablet yazılmaz', async () => {
    const { storage } = setup({
      medications: JSON.stringify([{ ...legacyMedication, form: 'syrup' }]),
    });
    expect((await storage.load()).medications[0]?.form).toBe('syrup');
  });

  it('daha yeni bir sürümden gelen veride göç yapmaz', async () => {
    const { store, storage } = setup({
      medications: JSON.stringify([makeMedication()]),
      schemaVersion: '99',
    });
    const data = await storage.load();
    expect(data.medications).toHaveLength(1);
    expect(store.multiSetCalls).toBe(0);
    expect(store.data.get('schemaVersion')).toBe('99');
  });

  it('bozuk sürüm numarası v0 sayılır', async () => {
    const { store, storage } = setup({
      medications: JSON.stringify([legacyMedication]),
      schemaVersion: 'abc',
    });
    await storage.load();
    expect(store.data.get('schemaVersion')).toBe(String(CURRENT_SCHEMA_VERSION));
  });

  it('bozuk JSON çökertmez: yedeklenir, uyarı verilir, asıl kayıt ezilmez', async () => {
    const { store, storage } = setup({ medications: '[{"id":"m1",' });

    const data = await storage.load();

    expect(data.medications).toEqual([]);
    expect(data.warnings).toEqual([
      'Kayıtlı ilaç listeniz okunamadı. Bozuk veri yedeklendi; lütfen ilaçlarınızı kontrol edin.',
    ]);
    expect(store.data.get(`medications.yedek-${NOW.getTime()}`)).toBe('[{"id":"m1",');
    expect(store.data.get('medications')).toBe('[{"id":"m1",');
    expect(store.data.has('schemaVersion')).toBe(false);
  });

  it('dizi olmayan JSON bozuk sayılır', async () => {
    const { store, storage } = setup({ doseLogs: '{"a":1}' });
    const data = await storage.load();
    expect(data.doseLogs).toEqual([]);
    expect(data.warnings).toEqual(['Geçmiş doz kayıtlarınız okunamadı. Bozuk veri yedeklendi.']);
    expect(store.data.get(`doseLogs.yedek-${NOW.getTime()}`)).toBe('{"a":1}');
  });

  it('dizideki bozuk kayıtlar atlanır, sağlamlar gösterilir', async () => {
    const raw = JSON.stringify([legacyMedication, { name: 'kimliksiz' }, 42]);
    const { store, storage } = setup({ medications: raw });

    const data = await storage.load();

    expect(data.medications.map((item) => item.id)).toEqual(['m1']);
    expect(data.warnings).toEqual([
      'Kayıtlı 2 ilaç okunamadı ve listeden çıkarıldı. Bozuk veri yedeklendi.',
    ]);
    expect(store.data.get(`medications.yedek-${NOW.getTime()}`)).toBe(raw);
  });

  it('eksik alanlar varsayılanla doldurulur, negatif stok sıfır olur', async () => {
    const { storage } = setup({
      medications: JSON.stringify([{ ...legacyMedication, stock: -4, times: 'sabah' }]),
    });
    const [medication] = (await storage.load()).medications;
    expect(medication?.stock).toBe(0);
    expect(medication?.times).toEqual([]);
  });

  it('depolama hiç okunamazsa StorageError fırlatır ve yazmayı kapatır', async () => {
    const { store, storage, medications } = setup({
      medications: JSON.stringify([legacyMedication]),
    });
    store.failReads = true;

    await expect(storage.load()).rejects.toBeInstanceOf(StorageError);
    store.failReads = false;
    await expect(medications.add(makeMedication())).rejects.toBeInstanceOf(StorageError);
    expect(JSON.parse(store.data.get('medications')!)).toEqual([legacyMedication]);
  });

  it('bozuk veri yedeklenemezse üzerine yazılmaz', async () => {
    const { store, storage, medications } = setup({ medications: 'bozuk' });
    store.failWrites = true;
    await storage.load();
    store.failWrites = false;

    await expect(medications.add(makeMedication())).rejects.toBeInstanceOf(StorageError);
    expect(store.data.get('medications')).toBe('bozuk');
  });

  it('göç sonucu yazılamazsa yine de veriyi döner', async () => {
    const { store, storage } = setup({ medications: JSON.stringify([legacyMedication]) });
    store.failWrites = true;
    const data = await storage.load();
    expect(data.medications[0]?.form).toBe('tablet');
  });
});

describe('cihaz repository’leri: yazma', () => {
  const aspirin = makeMedication();
  const other = makeMedication({ id: 'ilac2', name: 'Coraspin' });
  const saved = (store: MemoryKeyValueStore, key: string) => JSON.parse(store.data.get(key)!);

  it('ilaç ekleme, güncelleme ve silme mevcut anahtara bütün listeyi yazar', async () => {
    const { store, medications } = setup({
      medications: JSON.stringify([aspirin]),
      schemaVersion: String(CURRENT_SCHEMA_VERSION),
    });
    await medications.load();
    await medications.add(other);
    expect(saved(store, 'medications')).toEqual([aspirin, other]);
    await medications.update({ ...aspirin, stock: 3 });
    expect(saved(store, 'medications')).toEqual([{ ...aspirin, stock: 3 }, other]);
    await medications.remove('ilac2');
    expect(saved(store, 'medications')).toEqual([{ ...aspirin, stock: 3 }]);
  });

  it('doz onayı ve stok tek seferde birlikte yazılır', async () => {
    const { store, doseLogs } = setup({
      medications: JSON.stringify([aspirin, other]),
      schemaVersion: String(CURRENT_SCHEMA_VERSION),
    });
    await doseLogs.load();
    await doseLogs.recordDose(legacyLog, { ...aspirin, stock: 9 });
    expect(store.multiSetCalls).toBe(1);
    expect(saved(store, 'doseLogs')).toEqual([legacyLog]);
    expect(saved(store, 'medications')).toEqual([{ ...aspirin, stock: 9 }, other]);
  });

  it('okunmadan yazılırsa önce diskteki kayıtlar okunur, hiçbiri kaybolmaz', async () => {
    const { store, medications } = setup({
      medications: JSON.stringify([aspirin]),
      schemaVersion: String(CURRENT_SCHEMA_VERSION),
    });
    await medications.add(other);
    expect(saved(store, 'medications')).toEqual([aspirin, other]);
  });

  it('iki repository aynı anda okursa disk bir kez okunur, bozuk veri bir kez yedeklenir', async () => {
    const { store, storage } = setup({ medications: 'bozuk' });
    const getItem = jest.spyOn(store, 'getItem');
    const setItem = jest.spyOn(store, 'setItem');
    await storage.load();
    expect(getItem).toHaveBeenCalledTimes(3);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it('yazma başarısızsa bellekteki liste değişmez', async () => {
    const { store, medications } = setup({
      medications: JSON.stringify([aspirin]),
      schemaVersion: String(CURRENT_SCHEMA_VERSION),
    });
    await medications.load();
    store.failWrites = true;
    await expect(medications.add(other)).rejects.toBeInstanceOf(StorageError);
    store.failWrites = false;
    await medications.update({ ...aspirin, stock: 1 });
    expect(saved(store, 'medications')).toEqual([{ ...aspirin, stock: 1 }]);
  });

  it('yazma hatası Türkçe mesajlı StorageError olur', async () => {
    const { store, medications } = setup();
    await medications.load();
    store.failWrites = true;
    await expect(medications.add(aspirin)).rejects.toMatchObject({
      userMessage: 'Bilgiler telefona kaydedilemedi. Lütfen tekrar deneyin.',
    });
  });
});

describe('migrations', () => {
  it('sürümler artan sırada', () => {
    const versions = MIGRATIONS.map((migration) => migration.version);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
  });

  it('güncel sürümden sonra göç çalışmaz', () => {
    const data = { medications: [legacyMedication], doseLogs: [] };
    expect(runMigrations(data, CURRENT_SCHEMA_VERSION)).toBe(data);
  });

  it('v1 nesne olmayan öğelere dokunmaz', () => {
    const result = runMigrations({ medications: [null, 'x'], doseLogs: [] }, 0);
    expect(result.medications).toEqual([null, 'x']);
  });
});
