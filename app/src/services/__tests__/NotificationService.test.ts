import * as Notifications from 'expo-notifications';

import { NotificationError } from '@/errors';
import { makeMedication } from '@/test-utils/fakes';

import { NotificationService, type NotificationsApi } from '../NotificationService';

function fakeApi(scheduledIds: string[] = []) {
  const api = {
    emitTap: (_response: Notifications.NotificationResponse) => {},
    removeListener: jest.fn(),
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
    getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
    getAllScheduledNotificationsAsync: jest
      .fn()
      .mockResolvedValue(scheduledIds.map((identifier) => ({ identifier }))),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
    getLastNotificationResponse: jest
      .fn<Notifications.NotificationResponse | null, []>()
      .mockReturnValue(null),
    addNotificationResponseReceivedListener: jest.fn(),
    clearLastNotificationResponseAsync: jest.fn().mockResolvedValue(undefined),
  };
  api.addNotificationResponseReceivedListener.mockImplementation(
    (listener: (response: Notifications.NotificationResponse) => void) => {
      api.emitTap = listener;
      return { remove: api.removeListener };
    },
  );
  return api as typeof api & NotificationsApi;
}

function response(
  date: number,
  data: Record<string, unknown>,
  action?: string,
  identifier = 'ilac1-08:00',
) {
  return {
    actionIdentifier: action ?? Notifications.DEFAULT_ACTION_IDENTIFIER,
    notification: { date, request: { identifier, content: { data } } },
  } as unknown as Notifications.NotificationResponse;
}

const scheduledIdsOf = (api: ReturnType<typeof fakeApi>) =>
  api.scheduleNotificationAsync.mock.calls.map(([request]) => request.identifier);

describe('NotificationService.normalizeDate', () => {
  // 16 Kasım 2026 09:00 yerel saat
  const expected = new Date(2026, 10, 16, 9, 0);

  it('iOS saniye cinsinden tarih verir', () => {
    expect(NotificationService.normalizeDate(expected.getTime() / 1000)).toEqual(expected);
  });

  it('Android milisaniye cinsinden tarih verir', () => {
    expect(NotificationService.normalizeDate(expected.getTime())).toEqual(expected);
  });
});

describe('NotificationService.doseTargetFromResponse', () => {
  const service = new NotificationService(fakeApi(), 'ios');
  const sent = new Date(2026, 10, 16, 23, 59);
  const data = { medicationId: 'ilac1', time: '23:59' };

  it('iOS ve Android tarihinden aynı günü çıkarır', () => {
    const ios = service.doseTargetFromResponse(response(sent.getTime() / 1000, data));
    const android = service.doseTargetFromResponse(response(sent.getTime(), data));
    expect(ios).toEqual({ medicationId: 'ilac1', time: '23:59', date: '2026-11-16' });
    expect(android).toEqual(ios);
  });

  it('gece yarısından sonra açılsa da bildirimin geldiği güne yazılır', () => {
    const target = service.doseTargetFromResponse(response(sent.getTime(), data));
    expect(target?.date).toBe('2026-11-16');
  });

  it('eksik veya bozuk veride null döner', () => {
    expect(service.doseTargetFromResponse(response(sent.getTime(), {}))).toBeNull();
    expect(
      service.doseTargetFromResponse(
        response(sent.getTime(), { medicationId: 'a', time: '25:00' }),
      ),
    ).toBeNull();
    expect(
      service.doseTargetFromResponse(response(sent.getTime(), { medicationId: 3, time: '08:00' })),
    ).toBeNull();
  });

  it('varsayılan dokunuş dışındaki eylemleri yok sayar', () => {
    expect(service.doseTargetFromResponse(response(sent.getTime(), data, 'ertele'))).toBeNull();
  });
});

describe('NotificationService planlama', () => {
  it('her saat için ilacId-saat kimlikli günlük bildirim kurar', async () => {
    const api = fakeApi();
    await new NotificationService(api, 'ios').sync([makeMedication()]);
    expect(scheduledIdsOf(api)).toEqual(['ilac1-08:00', 'ilac1-20:00']);
    expect(api.scheduleNotificationAsync.mock.calls[0][0].trigger).toMatchObject({
      hour: 8,
      minute: 0,
    });
  });

  it('Android de önce bildirim kanalı oluşturur, iOS ta oluşturmaz', async () => {
    const android = fakeApi();
    const ios = fakeApi();
    await new NotificationService(android, 'android').requestPermission();
    await new NotificationService(ios, 'ios').requestPermission();
    expect(android.setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(ios.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('planlama hatası NotificationError olur', async () => {
    const api = fakeApi();
    api.scheduleNotificationAsync.mockRejectedValue(new Error('izin yok'));
    await expect(
      new NotificationService(api, 'ios').sync([makeMedication()]),
    ).rejects.toBeInstanceOf(NotificationError);
  });

  it('eşitleme: fazlaları siler, test bildirimine dokunmaz, eksikleri kurar', async () => {
    const api = fakeApi(['ilac1-08:00', 'silinmis-09:00', 'test-123']);
    await new NotificationService(api, 'ios').sync([makeMedication()]);

    expect(api.cancelScheduledNotificationAsync.mock.calls).toEqual([['silinmis-09:00']]);
    expect(scheduledIdsOf(api)).toEqual(['ilac1-20:00']);
  });

  it('eşitleme ertelenmiş bildirime dokunmaz', async () => {
    const api = fakeApi(['ertele-ilac1_2026-11-16_08:00']);
    await new NotificationService(api, 'ios').sync([]);
    expect(api.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it('ilacın bütün hatırlatmalarını iptal eder, diğer ilaçlara dokunmaz', async () => {
    const own = [
      'ilac1-08:00',
      'ilac1-08:00-g1',
      'ilac1-08:00-2026-11-16',
      'ertele-ilac1_2026-11-16_08:00',
    ];
    const api = fakeApi([...own, 'ilac10-08:00', 'ertele-ilac10_2026-11-16_08:00', 'test-1']);
    await new NotificationService(api, 'ios').cancelMedication(makeMedication());
    expect(api.cancelScheduledNotificationAsync.mock.calls.map(([id]) => id)).toEqual(own);
  });

  it('belirli günlerde haftalık bildirim kurar (1 = Pazar)', async () => {
    const api = fakeApi();
    await new NotificationService(api, 'ios').sync([
      makeMedication({ times: ['08:00'], schedule: { kind: 'weekdays', days: [0, 3] } }),
    ]);
    expect(scheduledIdsOf(api)).toEqual(['ilac1-08:00-g0', 'ilac1-08:00-g3']);
    expect(
      api.scheduleNotificationAsync.mock.calls.map(([request]) => request.trigger.weekday),
    ).toEqual([1, 4]);
  });

  it('süreli ilaçta yalnızca kalan günlere bildirim kurar', async () => {
    const api = fakeApi();
    const now = () => new Date(2026, 10, 16, 12, 0);
    await new NotificationService(api, 'ios', now).sync([
      makeMedication({ startDate: '2026-11-15', duration: { kind: 'days', count: 3 } }),
    ]);
    expect(scheduledIdsOf(api)).toEqual([
      'ilac1-20:00-2026-11-16',
      'ilac1-08:00-2026-11-17',
      'ilac1-20:00-2026-11-17',
    ]);
    expect(api.scheduleNotificationAsync.mock.calls[0][0].trigger.date).toEqual(
      new Date(2026, 10, 16, 20, 0),
    );
  });

  it('süresi biten ilaca bildirim kurmaz', async () => {
    const api = fakeApi();
    await new NotificationService(api, 'ios', () => new Date(2026, 10, 16)).sync([
      makeMedication({ startDate: '2026-11-01', duration: { kind: 'days', count: 7 } }),
    ]);
    expect(api.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('iOS sınırı: süreli bildirimler en yakından başlayarak 60 ile sınırlanır', async () => {
    const api = fakeApi();
    await new NotificationService(api, 'ios', () => new Date(2026, 10, 16)).sync([
      makeMedication({
        id: 'sureli',
        startDate: '2026-11-16',
        duration: { kind: 'days', count: 90 },
      }),
      makeMedication(),
    ]);
    const ids = scheduledIdsOf(api);
    expect(ids).toHaveLength(60);
    expect(ids.slice(0, 3)).toEqual(['ilac1-08:00', 'ilac1-20:00', 'sureli-08:00-2026-11-16']);
  });

  it('test bildirimi test- önekiyle 60 saniye sonraya kurulur', async () => {
    const api = fakeApi();
    await new NotificationService(api, 'ios').scheduleTest({
      medication: makeMedication(),
      date: '2026-11-16',
      time: '08:00',
      status: 'bekliyor',
    });
    const [request] = api.scheduleNotificationAsync.mock.calls[0];
    expect(request.identifier).toMatch(/^test-/);
    expect(request.trigger).toMatchObject({ seconds: 60 });
    expect(request.content.data).toEqual({ medicationId: 'ilac1', time: '08:00' });
  });

  it('izin durumunu okur ve configure işleyiciyi kurar', async () => {
    const api = fakeApi();
    const service = new NotificationService(api, 'ios');
    service.configure();
    expect(api.setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(await service.hasPermission()).toBe(true);
    expect(await service.requestPermission()).toBe(false);
  });
});

describe('NotificationService erteleme', () => {
  const dose = { medication: makeMedication(), date: '2026-11-16', time: '23:55' };

  it('10 dakika sonraya tek seferlik bildirim kurar', async () => {
    const api = fakeApi();
    await new NotificationService(api, 'ios').snooze(dose);
    const [request] = api.scheduleNotificationAsync.mock.calls[0];
    expect(request.identifier).toBe('ertele-ilac1_2026-11-16_23:55');
    expect(request.trigger).toMatchObject({ type: 'timeInterval', seconds: 600 });
    expect(request.trigger.repeats).toBeUndefined();
    expect(request.content.data).toEqual({
      medicationId: 'ilac1',
      time: '23:55',
      date: '2026-11-16',
    });
  });

  it('aynı doz yeniden ertelenince kimlik değişmez, bildirim çoğalmaz', async () => {
    const api = fakeApi();
    const service = new NotificationService(api, 'ios');
    await service.snooze(dose);
    await service.snooze(dose);
    expect(new Set(scheduledIdsOf(api)).size).toBe(1);
  });

  it('gece yarısını geçen ertelemede doz asıl gününe yazılır', () => {
    const afterMidnight = new Date(2026, 10, 17, 0, 5).getTime();
    const data = { medicationId: 'ilac1', time: '23:55', date: '2026-11-16' };
    const service = new NotificationService(fakeApi(), 'ios');
    expect(service.doseTargetFromResponse(response(afterMidnight, data))?.date).toBe('2026-11-16');
    expect(
      service.doseTargetFromResponse(response(afterMidnight, { ...data, date: 'bozuk' }))?.date,
    ).toBe('2026-11-17');
  });

  it('izin yoksa veya planlanamazsa NotificationError verir', async () => {
    const denied = fakeApi();
    denied.getPermissionsAsync.mockResolvedValue({ granted: false });
    await expect(new NotificationService(denied, 'ios').snooze(dose)).rejects.toBeInstanceOf(
      NotificationError,
    );
    expect(denied.scheduleNotificationAsync).not.toHaveBeenCalled();

    const failing = fakeApi();
    failing.scheduleNotificationAsync.mockRejectedValue(new Error('hata'));
    await expect(new NotificationService(failing, 'ios').snooze(dose)).rejects.toBeInstanceOf(
      NotificationError,
    );
  });

  it('onaylanan dozun ertelemesini kaldırır', async () => {
    const api = fakeApi();
    await new NotificationService(api, 'ios').cancelSnooze('ilac1', '2026-11-16', '23:55');
    expect(api.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'ertele-ilac1_2026-11-16_23:55',
    );
  });
});

describe('NotificationService.subscribeToDoseTaps', () => {
  const sent = new Date(2026, 10, 16, 8, 0).getTime();
  const data = { medicationId: 'ilac1', time: '08:00' };
  const target = { medicationId: 'ilac1', time: '08:00', date: '2026-11-16' };

  it('uygulama kapalıyken gelen son dokunuşu hemen bildirir ve temizler', () => {
    const api = fakeApi();
    api.getLastNotificationResponse.mockReturnValue(response(sent, data));
    const onTap = jest.fn();

    new NotificationService(api, 'ios').subscribeToDoseTaps(onTap);

    expect(onTap).toHaveBeenCalledWith(target);
    expect(api.clearLastNotificationResponseAsync).toHaveBeenCalledTimes(1);
  });

  it('uygulama açıkken gelen dokunuşu bildirir', () => {
    const api = fakeApi();
    const onTap = jest.fn();
    new NotificationService(api, 'ios').subscribeToDoseTaps(onTap);

    api.emitTap(response(sent, data));

    expect(onTap).toHaveBeenCalledWith(target);
  });

  it('aynı dokunuş iki kez sayfa açmaz, ertesi günün bildirimi açar', () => {
    const api = fakeApi();
    api.getLastNotificationResponse.mockReturnValue(response(sent, data));
    const onTap = jest.fn();
    new NotificationService(api, 'ios').subscribeToDoseTaps(onTap);

    api.emitTap(response(sent, data));
    expect(onTap).toHaveBeenCalledTimes(1);

    api.emitTap(response(sent + 24 * 60 * 60 * 1000, data));
    expect(onTap).toHaveBeenCalledTimes(2);
  });

  it('bozuk veri veya başka eylemde sayfa açmaz ve yanıtı temizlemez', () => {
    const api = fakeApi();
    const onTap = jest.fn();
    new NotificationService(api, 'ios').subscribeToDoseTaps(onTap);

    api.emitTap(response(sent, {}));
    api.emitTap(response(sent, data, 'ertele'));

    expect(onTap).not.toHaveBeenCalled();
    expect(api.clearLastNotificationResponseAsync).not.toHaveBeenCalled();
  });

  it('dönen fonksiyon dinlemeyi bırakır', () => {
    const api = fakeApi();
    const unsubscribe = new NotificationService(api, 'ios').subscribeToDoseTaps(jest.fn());
    unsubscribe();
    expect(api.removeListener).toHaveBeenCalledTimes(1);
  });
});
