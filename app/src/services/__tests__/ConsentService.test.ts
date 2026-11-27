import { OfflineError } from '@/errors';
import { makeMedication, MemoryKeyValueStore } from '@/test-utils/fakes';

import { ConsentService, type ConsentApi } from '../ConsentService';
import { LocalDeviceStore } from '../local/LocalDeviceStore';
import { LocalMedicationRepository } from '../local/LocalMedicationRepository';
import { NotificationService, type NotificationsApi } from '../NotificationService';

const NOW = new Date('2026-11-27T09:00:00.000Z');
const USER = 'kisi-1';
const GRANTED = JSON.stringify({
  userId: USER,
  status: 'granted',
  at: '2026-11-20T09:00:00.000Z',
  textVersion: '2026-11-1',
});

function setup({ online = true } = {}) {
  const medications = JSON.stringify([makeMedication()]);
  const doseLogs = JSON.stringify([
    {
      id: 'ilac1_2026-11-26_08:00',
      medicationId: 'ilac1',
      date: '2026-11-26',
      time: '08:00',
      takenAt: '2026-11-26T05:00:00.000Z',
    },
  ]);
  const store = new MemoryKeyValueStore({
    medications,
    doseLogs,
    schemaVersion: '3',
    outbox: '[{"kind":"medication","id":"ilac1"}]',
    syncState: '{"cursor":"2026-11-27T08:00:00.123456+00:00"}',
    healthConsent: GRANTED,
  });
  const calls: string[] = [];
  const api = {
    grant: jest.fn(async (_version: string) => void calls.push('grant')),
    removeOwnPhotos: jest.fn(async () => void calls.push('photos')),
    withdraw: jest.fn(async () => void calls.push('withdraw')),
  } satisfies ConsentApi;
  const sync = {
    stop: jest.fn(async () => void calls.push('stop')),
    start: jest.fn(() => void calls.push('start')),
  };
  const network = { isOnline: jest.fn(async () => online) };
  const service = new ConsentService(api, store, sync, network, () => NOW);
  return { store, api, sync, network, service, calls, medications, doseLogs };
}

/** Kurulan bildirimleri tutan cihaz sahtesi. */
function deviceNotifications(initial: string[]) {
  const pending = new Set(initial);
  const api = {
    getAllScheduledNotificationsAsync: jest.fn(async () =>
      [...pending].map((identifier) => ({ identifier })),
    ),
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(async (id: string) => void pending.delete(id)),
    cancelAllScheduledNotificationsAsync: jest.fn(async () => pending.clear()),
  };
  return { api: api as unknown as NotificationsApi, pending };
}

describe('ConsentService.current', () => {
  it('telefondaki rıza kaydını okur; başka kullanıcının kaydı sayılmaz', async () => {
    const { service } = setup();
    expect(await service.current(USER)).toMatchObject({ status: 'granted' });
    expect(await service.current('baska-kisi')).toEqual({ status: 'none', at: null });
  });

  it('kayıt yoksa veya bozuksa rıza yok sayılır', async () => {
    const { store, service } = setup();
    store.data.set('healthConsent', '{bozuk');
    expect(await service.current(USER)).toEqual({ status: 'none', at: null });
  });
});

describe('ConsentService.grant', () => {
  it('sunucuya yazar, telefona kaydeder ve eşitlemeyi başlatır', async () => {
    const { store, api, sync, service } = setup();
    store.data.delete('healthConsent');
    await service.grant(USER, '2026-11-1');
    expect(api.grant).toHaveBeenCalledWith('2026-11-1');
    expect(await service.current(USER)).toEqual({ status: 'granted', at: NOW.toISOString() });
    expect(sync.start).toHaveBeenCalled();
  });

  it('internet yoksa hiçbir şey yapmaz', async () => {
    const { api, service } = setup({ online: false });
    await expect(service.grant(USER, '2026-11-1')).rejects.toBeInstanceOf(OfflineError);
    expect(api.grant).not.toHaveBeenCalled();
  });
});

describe('ConsentService.decline ("Şimdilik hayır")', () => {
  it('yalnızca telefona yazılır; internet istemez, sunucuya gitmez, eşitleme başlamaz', async () => {
    const { store, api, sync, service } = setup({ online: false });
    store.data.delete('healthConsent');
    await service.decline(USER);
    expect(await service.current(USER)).toEqual({ status: 'declined', at: NOW.toISOString() });
    expect(api.grant).not.toHaveBeenCalled();
    expect(sync.start).not.toHaveBeenCalled();
  });
});

describe('ConsentService.withdraw', () => {
  it('sırayla: eşitlemeyi durdurur, fotoğrafları siler, sunucu verisini siler', async () => {
    const { calls, service } = setup();
    await service.withdraw(USER);
    expect(calls).toEqual(['stop', 'photos', 'withdraw']);
  });

  it('telefondaki ilaçlar, doz geçmişi ve hatırlatmalar silinmez; yalnızca eşitleme kayıtları temizlenir', async () => {
    const { store, service, medications, doseLogs } = setup();
    const device = new LocalDeviceStore(store, () => NOW);
    const repository = new LocalMedicationRepository(device);
    const before = await repository.load();
    const notifications = deviceNotifications(['ilac1-08:00', 'ilac1-20:00', 'ertele-ilac1_x']);
    // Bildirim servisi gerçek; rıza servisi onu hiç bilmez, ama sonuçla da doğrulanır.
    new NotificationService(notifications.api, 'ios', () => NOW);

    await service.withdraw(USER);

    expect(store.data.get('medications')).toBe(medications);
    expect(store.data.get('doseLogs')).toBe(doseLogs);
    expect(store.data.get('schemaVersion')).toBe('3');
    expect(store.data.has('outbox')).toBe(false);
    expect(store.data.has('syncState')).toBe(false);
    expect(
      await new LocalMedicationRepository(new LocalDeviceStore(store, () => NOW)).load(),
    ).toEqual(before);
    expect([...notifications.pending].sort()).toEqual([
      'ertele-ilac1_x',
      'ilac1-08:00',
      'ilac1-20:00',
    ]);
    expect(await service.current(USER)).toEqual({ status: 'withdrawn', at: NOW.toISOString() });
  });

  it('eşitleme geri alındıktan sonra yeniden başlamaz', async () => {
    const { sync, service } = setup();
    await service.withdraw(USER);
    expect(sync.start).not.toHaveBeenCalled();
  });

  it('internet yoksa geri alınmaz ve hiçbir şey değişmez ("İnternet bağlantısı gerekiyor")', async () => {
    const { store, api, sync, service } = setup({ online: false });
    const error = await service.withdraw(USER).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(OfflineError);
    expect((error as OfflineError).userMessage).toBe('İnternet bağlantısı gerekiyor');
    expect(api.removeOwnPhotos).not.toHaveBeenCalled();
    expect(api.withdraw).not.toHaveBeenCalled();
    expect(sync.stop).not.toHaveBeenCalled();
    expect(store.data.get('healthConsent')).toBe(GRANTED);
  });

  it('sunucu hatasında rıza verilmiş kalır, eşitleme yeniden başlar, kuyruk korunur', async () => {
    const { store, api, sync, service } = setup();
    api.withdraw.mockRejectedValue(new Error('ağ koptu'));
    await expect(service.withdraw(USER)).rejects.toThrow();
    expect(sync.start).toHaveBeenCalled();
    expect(store.data.has('outbox')).toBe(true);
    expect(store.data.get('healthConsent')).toBe(GRANTED);
  });
});
