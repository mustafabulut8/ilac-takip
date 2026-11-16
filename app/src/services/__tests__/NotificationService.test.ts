import * as Notifications from 'expo-notifications';

import { NotificationError } from '@/errors';
import { makeMedication } from '@/test-utils/fakes';

import { NotificationService, type NotificationsApi } from '../NotificationService';

function fakeApi(scheduledIds: string[] = []) {
  const api = {
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
    getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
    getAllScheduledNotificationsAsync: jest
      .fn()
      .mockResolvedValue(scheduledIds.map((identifier) => ({ identifier }))),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  };
  return api as typeof api & NotificationsApi;
}

function response(date: number, data: Record<string, unknown>, action?: string) {
  return {
    actionIdentifier: action ?? Notifications.DEFAULT_ACTION_IDENTIFIER,
    notification: { date, request: { content: { data } } },
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
    await new NotificationService(api, 'ios').scheduleMedication(makeMedication());
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
      new NotificationService(api, 'ios').scheduleMedication(makeMedication()),
    ).rejects.toBeInstanceOf(NotificationError);
  });

  it('eşitleme: fazlaları siler, test bildirimine dokunmaz, eksikleri kurar', async () => {
    const api = fakeApi(['ilac1-08:00', 'silinmis-09:00', 'test-123']);
    await new NotificationService(api, 'ios').sync([makeMedication()]);

    expect(api.cancelScheduledNotificationAsync.mock.calls).toEqual([['silinmis-09:00']]);
    expect(scheduledIdsOf(api)).toEqual(['ilac1-20:00']);
  });

  it('ilacın hatırlatmalarını iptal eder', async () => {
    const api = fakeApi();
    await new NotificationService(api, 'ios').cancelMedication(makeMedication());
    expect(api.cancelScheduledNotificationAsync.mock.calls).toEqual([
      ['ilac1-08:00'],
      ['ilac1-20:00'],
    ]);
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
