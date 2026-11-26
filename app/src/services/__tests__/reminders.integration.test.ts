import { makeMedication, FakeStorage } from '@/test-utils/fakes';

import { MedicationService } from '../MedicationService';
import { NotificationService, type NotificationsApi } from '../NotificationService';

const NOW = new Date(2026, 10, 16, 9, 0);

/** Kurulan bildirimleri gerçekten tutan cihaz sahtesi. */
function deviceNotifications(initial: string[] = []) {
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

function setup(initial: string[] = []) {
  const device = deviceNotifications(initial);
  const notifications = new NotificationService(device.api, 'ios', () => NOW);
  const photos = { savePhoto: jest.fn(), deletePhoto: jest.fn() };
  const service = new MedicationService(
    new FakeStorage().repositories,
    photos,
    notifications,
    () => NOW,
  );
  return { ...device, service };
}

const sorted = (ids: Set<string>) => [...ids].sort();

describe('hatırlatmalar: silme ve düzenleme', () => {
  const aspirin = makeMedication();
  const other = makeMedication({ id: 'ilac10', name: 'Coraspin', times: ['12:00'] });

  it('silinen ilacın tekrarlanan ve ertelenmiş bildirimleri kalkar, diğerleri kalır', async () => {
    const { service, pending } = setup([
      'ilac1-08:00',
      'ilac1-20:00',
      'ertele-ilac1_2026-11-16_08:00',
      'ilac10-12:00',
      'test-1',
    ]);
    await service.remove([aspirin, other], 'ilac1');
    expect(sorted(pending)).toEqual(['ilac10-12:00', 'test-1']);
  });

  it('saat değişince eski saatin bildirimi kalkar, yenisi kurulur', async () => {
    const { service, pending } = setup(['ilac1-08:00', 'ilac1-20:00', 'ilac10-12:00']);
    await service.update([aspirin, other], 'ilac1', { times: ['09:30'] });
    expect(sorted(pending)).toEqual(['ilac1-09:30', 'ilac10-12:00']);
  });

  it('her gün → belirli günler değişince günlük bildirim yerine haftalıklar kurulur', async () => {
    const { service, pending } = setup(['ilac1-08:00', 'ilac1-20:00']);
    await service.update([aspirin], 'ilac1', { schedule: { kind: 'weekdays', days: [1, 4] } });
    expect(sorted(pending)).toEqual([
      'ilac1-08:00-g1',
      'ilac1-08:00-g4',
      'ilac1-20:00-g1',
      'ilac1-20:00-g4',
    ]);
  });

  it('süreli kür sürekliye çevrilince gün gün kurulan bildirimler kalkar', async () => {
    const course = makeMedication({
      times: ['08:00'],
      startDate: '2026-11-16',
      duration: { kind: 'days', count: 3 },
    });
    const { service, pending } = setup(['ilac1-08:00-2026-11-17', 'ilac1-08:00-2026-11-18']);
    await service.update([course], 'ilac1', { duration: { kind: 'continuous' } });
    expect(sorted(pending)).toEqual(['ilac1-08:00']);
  });
});
