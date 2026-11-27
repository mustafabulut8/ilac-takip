import { makeMedication, MemoryKeyValueStore } from '@/test-utils/fakes';

import { LocalDeviceStore } from '../local/LocalDeviceStore';
import { LocalDoseLogRepository } from '../local/LocalDoseLogRepository';
import { LocalMedicationRepository } from '../local/LocalMedicationRepository';
import { OfflineFirstDoseLogRepository, OfflineFirstMedicationRepository, Outbox } from '../Outbox';

const NOW = new Date('2026-11-27T09:00:00.000Z');
const log = {
  id: 'ilac1_2026-11-27_08:00',
  medicationId: 'ilac1',
  date: '2026-11-27',
  time: '08:00',
  takenAt: NOW.toISOString(),
};

function setup({ enabled = true } = {}) {
  const store = new MemoryKeyValueStore();
  const outbox = new Outbox(store);
  const device = new LocalDeviceStore(store, () => NOW);
  const local = new LocalMedicationRepository(device);
  const isEnabled = jest.fn(() => enabled);
  const medications = new OfflineFirstMedicationRepository(local, outbox, isEnabled, () => NOW);
  const doseLogs = new OfflineFirstDoseLogRepository(
    new LocalDoseLogRepository(device),
    local,
    outbox,
    isEnabled,
  );
  return { store, outbox, local, medications, doseLogs, isEnabled };
}

describe('Outbox', () => {
  it('boş başlar; bozuk kayıt boş sayılır', async () => {
    const { store, outbox } = setup();
    expect(await outbox.entries()).toEqual([]);
    store.data.set('outbox', '{bozuk');
    expect(await outbox.entries()).toEqual([]);
  });

  it('aynı ilacın değişiklikleri tek kayıtta birleşir; silme önceki değişikliğin yerini alır', async () => {
    const { outbox } = setup();
    await outbox.enqueue({ kind: 'medication', id: 'a' });
    await outbox.enqueue({ kind: 'medication', id: 'a' });
    await outbox.enqueue({ kind: 'medication', id: 'b' });
    await outbox.enqueue({ kind: 'medicationDeleted', id: 'a', at: NOW.toISOString() });
    expect(await outbox.entries()).toEqual([
      { kind: 'medication', id: 'b' },
      { kind: 'medicationDeleted', id: 'a', at: NOW.toISOString() },
    ]);
  });

  it('gönderilen kayıt çıkarılır, diğerleri kalır', async () => {
    const { outbox } = setup();
    await outbox.enqueue({ kind: 'medication', id: 'a' });
    await outbox.enqueue({ kind: 'medication', id: 'b' });
    await outbox.remove({ kind: 'medication', id: 'a' });
    expect(await outbox.entries()).toEqual([{ kind: 'medication', id: 'b' }]);
    expect(await outbox.hasPendingMedication('b')).toBe(true);
    expect(await outbox.hasPendingMedication('a')).toBe(false);
  });
});

describe('OfflineFirst repository (önce telefon, sonra kuyruk)', () => {
  it('ekleme, güncelleme ve silme telefona yazılır ve kuyruğa girer', async () => {
    const { local, medications, outbox } = setup();
    await medications.add(makeMedication());
    expect((await local.load()).items).toHaveLength(1);
    expect(await outbox.entries()).toEqual([{ kind: 'medication', id: 'ilac1' }]);

    await medications.remove('ilac1');
    expect((await local.load()).items).toEqual([]);
    expect(await outbox.entries()).toEqual([
      { kind: 'medicationDeleted', id: 'ilac1', at: NOW.toISOString() },
    ]);
  });

  it('doz onayı düşen miktarla kuyruğa girer (sunucu stoğu kendisi düşürür)', async () => {
    const { medications, doseLogs, outbox } = setup();
    await medications.add(makeMedication({ stock: 10, amount: 0.5 }));
    await doseLogs.recordDose(log, makeMedication({ stock: 9.5, amount: 0.5 }));
    expect(await outbox.entries()).toContainEqual({ kind: 'dose', log, amount: 0.5 });
  });

  it('eşitleme kapalıysa (rıza yok) yalnızca telefona yazılır, kuyruk büyümez', async () => {
    const { local, medications, doseLogs, outbox } = setup({ enabled: false });
    await medications.add(makeMedication());
    await doseLogs.recordDose(log, makeMedication({ stock: 9 }));
    expect((await local.load()).items).toHaveLength(1);
    expect(await outbox.entries()).toEqual([]);
  });

  it('telefona yazılamazsa kuyruğa da girmez', async () => {
    const { store, medications, outbox } = setup();
    await medications.add(makeMedication());
    await outbox.remove({ kind: 'medication', id: 'ilac1' });
    store.failWrites = true;
    await expect(medications.update(makeMedication({ name: 'X' }))).rejects.toThrow();
    store.failWrites = false;
    expect(await outbox.entries()).toEqual([]);
  });
});
