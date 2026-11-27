import type { NewMedication } from '@/models';
import { deviceNotifications, MemoryKeyValueStore } from '@/test-utils/fakes';

import { AccountSession } from '../AccountSession';
import { LocalDeviceStore } from '../local/LocalDeviceStore';
import { LocalDoseLogRepository } from '../local/LocalDoseLogRepository';
import { LocalMedicationRepository } from '../local/LocalMedicationRepository';
import { UserScopedStore } from '../local/UserScopedStore';
import { MedicationService } from '../MedicationService';
import { NotificationService } from '../NotificationService';

/**
 * Aynı telefonda iki hesap: gerçek depo, gerçek bildirim servisi (sahte cihazla).
 * Bir kullanıcı diğerinin ilaçlarını görmemeli, hatırlatmaları başkasının oturumunda
 * çalmamalı; çıkış yapan kişi geri gelince ilaçları ve hatırlatmaları dönmeli.
 */
const NOW = new Date(2026, 10, 27, 7, 0);

function medicationInput(name: string, time: string): NewMedication {
  return {
    name,
    dose: '1 tablet',
    amount: 1,
    unit: 'adet',
    location: '',
    form: 'tablet',
    times: [time],
    schedule: { kind: 'daily' },
    duration: { kind: 'continuous' },
    mealTiming: 'any',
    stock: 30,
    lowStockThreshold: 5,
    markedLow: false,
    photoSourceUri: null,
  };
}

function phone(disk = new MemoryKeyValueStore()) {
  const scoped = new UserScopedStore(disk);
  const device = new LocalDeviceStore(scoped, () => NOW);
  const notifications = deviceNotifications();
  const reminders = new NotificationService(notifications.api, 'ios', () => NOW);
  const service = new MedicationService(
    {
      medications: new LocalMedicationRepository(device),
      doseLogs: new LocalDoseLogRepository(device),
    },
    { savePhoto: jest.fn(), deletePhoto: jest.fn() },
    reminders,
    () => NOW,
  );
  const sync = { stop: jest.fn().mockResolvedValue(undefined), setOwner: jest.fn() };
  const session = new AccountSession({
    store: scoped,
    device,
    sync,
    reminders,
    lastUser: disk,
  });
  /** Ekranın yaptığı gibi: hesap etkinleşir, liste yüklenir (yükleme hatırlatmaları kurar). */
  const signIn = async (userId: string | null) => {
    await session.activate(userId);
    return (await service.load()).medications;
  };
  return { disk, service, sync, signIn, pending: notifications.pending };
}

describe('aynı telefonda iki hesap', () => {
  it('B, A’nın ilaçlarını görmez; A’nın hatırlatmaları B’nin oturumunda çalmaz', async () => {
    const { service, signIn, pending } = phone();
    await service.add(await signIn('ayse'), medicationInput('Ayşe ilacı', '08:00'));
    expect([...pending].some((id) => id.endsWith('-08:00'))).toBe(true);

    expect(await signIn(null)).toEqual([]);
    expect(pending.size).toBe(0);

    const forB = await signIn('mehmet');
    expect(forB).toEqual([]);
    expect(pending.size).toBe(0);
    await service.add(forB, medicationInput('Mehmet ilacı', '21:00'));
    expect([...pending].every((id) => id.endsWith('-21:00'))).toBe(true);
  });

  it('çıkış eşitlemeyi durdurur; aynı kişi geri gelince ilaçları ve hatırlatmaları döner', async () => {
    const { service, sync, signIn, pending } = phone();
    await service.add(await signIn('ayse'), medicationInput('Ayşe ilacı', '08:00'));
    await signIn(null);
    expect(sync.stop).toHaveBeenCalled();
    expect(sync.setOwner).toHaveBeenLastCalledWith(null);

    await service.add(await signIn('mehmet'), medicationInput('Mehmet ilacı', '21:00'));
    await signIn(null);

    const back = await signIn('ayse');
    expect(back.map((item) => item.name)).toEqual(['Ayşe ilacı']);
    expect([...pending].map((id) => id.split('-').at(-1))).toEqual(['08:00']);
  });

  it('aynı kişi uygulamayı yeniden açınca bekleyen erteleme bildirimi silinmez', async () => {
    const first = phone();
    await first.service.add(await first.signIn('ayse'), medicationInput('Ayşe ilacı', '08:00'));
    // Aynı disk, yeni açılış: önceki oturumdan kalan "10 dakika sonra" bildirimi.
    const again = phone(first.disk);
    again.pending.add('ertele-x_2026-11-27_08:00');
    await again.signIn('ayse');
    expect(again.pending.has('ertele-x_2026-11-27_08:00')).toBe(true);
  });
});

describe('oturum öncesinden kalan veri (schemaVersion 4 göçü)', () => {
  const legacyMedication = {
    id: 'eski',
    name: 'Eski ilaç',
    dose: '1 tablet',
    times: ['09:00'],
    stock: 10,
    createdAt: '2026-11-01T08:00:00.000Z',
    photoFile: '',
  };

  it('ilk giren kullanıcıya bir kez taşınır; sonraki kullanıcı görmez', async () => {
    const disk = new MemoryKeyValueStore({
      medications: JSON.stringify([legacyMedication]),
      doseLogs: '[]',
      schemaVersion: '1',
    });
    const { signIn } = phone(disk);

    expect((await signIn('ayse')).map((item) => item.id)).toEqual(['eski']);
    expect(disk.data.has('medications')).toBe(false);
    expect(disk.data.get('u:ayse:schemaVersion')).toBe('4');

    await signIn(null);
    expect(await signIn('mehmet')).toEqual([]);
    await signIn(null);
    expect((await signIn('ayse')).map((item) => item.id)).toEqual(['eski']);
  });

  it('kullanıcının kendi verisi varsa eski verinin üzerine yazılmaz', async () => {
    const disk = new MemoryKeyValueStore({
      medications: JSON.stringify([legacyMedication]),
      'u:ayse:medications': '[]',
      'u:ayse:schemaVersion': '4',
    });
    const { signIn } = phone(disk);
    expect(await signIn('ayse')).toEqual([]);
    expect(disk.data.has('medications')).toBe(true);
  });
});
