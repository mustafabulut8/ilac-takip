import type { Medication } from '@/models';
import {
  deviceNotifications,
  FakeMedicationRows,
  makeMedication,
  MemoryKeyValueStore,
} from '@/test-utils/fakes';
import { toMedicationRow } from '@/validation/medication-rows';

import { LocalDeviceStore } from '../local/LocalDeviceStore';
import { LocalDoseLogRepository } from '../local/LocalDoseLogRepository';
import { LocalMedicationRepository } from '../local/LocalMedicationRepository';
import { NotificationService } from '../NotificationService';
import { Outbox } from '../Outbox';
import { RemoteMedicationRepository } from '../RemoteMedicationRepository';
import { SyncService } from '../SyncService';

const OWNER = 'yasli';
const NOW = new Date(2026, 10, 27, 9, 0);
const at = (minute: number) => new Date(2026, 10, 27, 8, minute).toISOString();

async function setup(local: Medication[] = [], scheduled: string[] = []) {
  const store = new MemoryKeyValueStore({ medications: JSON.stringify(local), schemaVersion: '3' });
  const deviceStore = new LocalDeviceStore(store, () => NOW);
  const localRepository = new LocalMedicationRepository(deviceStore);
  const rows = new FakeMedicationRows();
  const outbox = new Outbox(store);
  const device = deviceNotifications(scheduled);
  const reminders = new NotificationService(device.api, 'ios', () => NOW);
  const sync = new SyncService({
    local: localRepository,
    localDoseLogs: new LocalDoseLogRepository(deviceStore),
    remoteFor: (ownerId) => new RemoteMedicationRepository(rows, ownerId, () => NOW),
    api: rows,
    outbox,
    store,
    reminders,
  });
  const changes: Medication[][] = [];
  sync.subscribe((medications) => changes.push(medications));
  sync.setOwner(OWNER);
  sync.start();
  const localItems = async () => (await localRepository.load()).items;
  return { store, rows, outbox, sync, changes, localItems, pending: device.pending };
}

describe('SyncService: gönderme (push)', () => {
  it('kuyruktaki ilacın telefondaki son hâlini gönderir ve kuyruktan çıkarır', async () => {
    const medication = makeMedication({ name: 'Son hâl', updatedAt: at(0) });
    const { rows, outbox, sync } = await setup([medication]);
    await outbox.enqueue({ kind: 'medication', id: 'ilac1' });
    await sync.run();
    expect(rows.get('ilac1')).toMatchObject({ owner_id: OWNER, name: 'Son hâl' });
    expect(await outbox.entries()).toEqual([]);
  });

  it('eski sürüm atlanırsa telefon sunucudaki güncel hâle geçer, hatırlatmalar ona göre kurulur', async () => {
    const mine = makeMedication({ name: 'Telefondaki', times: ['08:00'], updatedAt: at(0) });
    const { rows, outbox, sync, changes, localItems, pending } = await setup(
      [mine],
      ['ilac1-08:00'],
    );
    rows.familyWrite(
      toMedicationRow(
        { ...mine, name: 'Aile düzeltti', times: ['09:30'], updatedAt: at(30) },
        OWNER,
      ),
    );
    await outbox.enqueue({ kind: 'medication', id: 'ilac1' });

    await sync.run();

    // Sunucudaki yeni sürüm ezilmedi; telefon kendi eski kopyasını göstermiyor.
    expect(rows.get('ilac1')).toMatchObject({ name: 'Aile düzeltti' });
    expect((await localItems())[0]).toMatchObject({ name: 'Aile düzeltti', times: ['09:30'] });
    expect(changes.at(-1)?.[0]?.name).toBe('Aile düzeltti');
    expect([...pending]).toEqual(['ilac1-09:30']);
    expect(await outbox.entries()).toEqual([]);
  });

  it('silmeyi silinme anıyla gönderir', async () => {
    const { rows, outbox, sync } = await setup();
    rows.put(toMedicationRow(makeMedication({ updatedAt: at(0) }), OWNER));
    await outbox.enqueue({ kind: 'medicationDeleted', id: 'ilac1', at: at(10) });
    await sync.run();
    expect(rows.get('ilac1')).toMatchObject({ deleted_at: at(10) });
  });

  it('doz onayını düşen miktarla gönderir', async () => {
    const { rows, outbox, sync } = await setup([makeMedication()]);
    const log = {
      id: 'd',
      medicationId: 'ilac1',
      date: '2026-11-27',
      time: '08:00',
      takenAt: at(1),
    };
    await outbox.enqueue({ kind: 'dose', log, amount: 1 });
    await sync.run();
    expect(rows.doses).toEqual([{ log, amount: 1 }]);
  });

  it('internet yoksa kuyruk korunur, hata fırlatılmaz', async () => {
    const { rows, outbox, sync } = await setup([makeMedication()]);
    rows.offline = true;
    await outbox.enqueue({ kind: 'medication', id: 'ilac1' });
    await expect(sync.run()).resolves.toBeUndefined();
    expect(await outbox.entries()).toHaveLength(1);
  });
});

describe('SyncService: alma (pull) ve hatırlatmalar', () => {
  it('ailenin eklediği ilaç telefona gelir, hatırlatması kurulur, "telefona ulaştı" yazılır', async () => {
    const { rows, sync, localItems, pending, changes } = await setup();
    rows.familyWrite(
      toMedicationRow(makeMedication({ times: ['10:00'], updatedAt: at(5) }), OWNER),
    );
    const version = String(rows.get('ilac1')?.server_updated_at);

    await sync.run();

    expect((await localItems()).map((item) => item.id)).toEqual(['ilac1']);
    expect([...pending]).toEqual(['ilac1-10:00']);
    // Mikro saniyeli sunucu sürümü metin olarak aynen geri gönderilir.
    expect(rows.delivered).toEqual([[{ id: 'ilac1', server_updated_at: version }]]);
    expect(changes).toHaveLength(1);
  });

  it('aile saati değiştirince eski hatırlatma kalkar, yenisi kurulur', async () => {
    const mine = makeMedication({ times: ['08:00'], updatedAt: at(0) });
    const { rows, sync, pending } = await setup(
      [mine],
      ['ilac1-08:00', 'ertele-ilac1_2026-11-27_08:00'],
    );
    rows.put(toMedicationRow(mine, OWNER));
    await sync.run();
    rows.familyWrite(toMedicationRow({ ...mine, times: ['09:00'], updatedAt: at(20) }, OWNER));

    await sync.run();

    expect([...pending]).toEqual(['ilac1-09:00']);
  });

  it('aile ilacı silince telefondan ve hatırlatmalardan kalkar', async () => {
    const mine = makeMedication({ updatedAt: at(0) });
    const other = makeMedication({ id: 'ilac2', times: ['12:00'], updatedAt: at(0) });
    const { rows, sync, pending, localItems } = await setup(
      [mine, other],
      ['ilac1-08:00', 'ilac1-20:00', 'ilac2-12:00'],
    );
    rows.put(toMedicationRow(mine, OWNER));
    rows.put(toMedicationRow(other, OWNER));
    await sync.run();
    rows.familyWrite({ id: 'ilac1', deleted_at: at(30), updated_at: at(30) });

    await sync.run();

    expect((await localItems()).map((item) => item.id)).toEqual(['ilac2']);
    expect([...pending]).toEqual(['ilac2-12:00']);
  });

  it('telefondaki daha yeni sürüm, sunucudaki eskisiyle ezilmez', async () => {
    const mine = makeMedication({ name: 'Yeni', updatedAt: at(40) });
    const { rows, sync, localItems } = await setup([mine]);
    rows.familyWrite(toMedicationRow({ ...mine, name: 'Eski', updatedAt: at(10) }, OWNER));
    await sync.run();
    expect((await localItems())[0]?.name).toBe('Yeni');
  });

  it('telefondaki fotoğraf dosyası korunur', async () => {
    const mine = makeMedication({ photoFile: 'yerel.jpg', updatedAt: at(0) });
    const { rows, sync, localItems } = await setup([mine]);
    rows.familyWrite(toMedicationRow({ ...mine, name: 'Yeni', updatedAt: at(10) }, OWNER));
    await sync.run();
    expect((await localItems())[0]).toMatchObject({ name: 'Yeni', photoFile: 'yerel.jpg' });
  });

  it('imleç metin olarak saklanır; sonraki eşitleme yalnızca yenileri ister', async () => {
    const { rows, sync, store } = await setup();
    rows.familyWrite(toMedicationRow(makeMedication({ updatedAt: at(5) }), OWNER));
    await sync.run();
    await sync.run();
    const version = String(rows.get('ilac1')?.server_updated_at);
    expect(rows.cursors).toEqual([null, version]);
    expect(JSON.parse(store.data.get('syncState')!)).toEqual({ ownerId: OWNER, cursor: version });
  });

  it('başka hesap açılınca imleç sıfırdan başlar', async () => {
    const { rows, sync, store } = await setup();
    store.data.set('syncState', JSON.stringify({ ownerId: 'baska', cursor: 'x' }));
    await sync.run();
    expect(rows.cursors).toEqual([null]);
  });
});

describe('SyncService: açma, kapama, ilk yükleme', () => {
  it('kapalıyken hiçbir şey göndermez; stop çalışan eşitlemeyi bekler', async () => {
    const { rows, outbox, sync } = await setup([makeMedication()]);
    await outbox.enqueue({ kind: 'medication', id: 'ilac1' });
    const running = sync.run();
    await sync.stop();
    await running;
    expect(sync.isEnabled()).toBe(false);
    rows.rows.clear();
    await sync.run();
    expect(rows.rows.size).toBe(0);
  });

  it('ilk yükleme telefondaki bütün ilaçları ve dozları gönderir; dozlar stoğu yeniden düşürmez', async () => {
    const { rows, sync, store } = await setup([makeMedication({ stock: 7 })]);
    store.data.set(
      'doseLogs',
      JSON.stringify([
        { id: 'd1', medicationId: 'ilac1', date: '2026-11-26', time: '08:00', takenAt: at(0) },
      ]),
    );
    await sync.uploadAll();
    expect(rows.get('ilac1')).toMatchObject({ stock: 7 });
    expect(rows.doses.map((dose) => dose.amount)).toEqual([0]);
  });
});
