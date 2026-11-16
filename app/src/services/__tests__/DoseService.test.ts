import type { DoseLog } from '@/models';
import { FakeStorage, makeMedication } from '@/test-utils/fakes';

import { DoseService } from '../DoseService';

const TODAY = new Date(2026, 10, 16);
const at = (hour: number, minute = 0, day = TODAY) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);

function setup(now = at(9)) {
  const storage = new FakeStorage();
  const service = new DoseService(storage, () => now);
  return { storage, service };
}

const log = (medicationId: string, date: string, time: string): DoseLog => ({
  id: DoseService.doseLogId(medicationId, date, time),
  medicationId,
  date,
  time,
  takenAt: '',
});

describe('DoseService.doseLogId', () => {
  it('ilaç, gün ve saatten belirleyici kimlik üretir', () => {
    expect(DoseService.doseLogId('ilac1', '2026-11-16', '08:00')).toBe('ilac1_2026-11-16_08:00');
    expect(DoseService.doseLogId('ilac1', '2026-11-16', '08:00')).toBe(
      DoseService.doseLogId('ilac1', '2026-11-16', '08:00'),
    );
  });
});

describe('DoseService.getTodayDoses', () => {
  const { service } = setup();
  const medication = makeMedication({ times: ['20:00', '08:00'] });

  it('dozları saate göre sıralar ve bugünün tarihini verir', () => {
    const doses = service.getTodayDoses([medication], [], at(7));
    expect(doses.map((dose) => dose.time)).toEqual(['08:00', '20:00']);
    expect(doses.every((dose) => dose.date === '2026-11-16')).toBe(true);
  });

  it('saatinden önce ve 30 dakika içinde "bekliyor"', () => {
    expect(service.getTodayDoses([medication], [], at(7, 59))[0].status).toBe('bekliyor');
    expect(service.getTodayDoses([medication], [], at(8, 30))[0].status).toBe('bekliyor');
  });

  it('30 dakika geçince "kacirildi"', () => {
    expect(service.getTodayDoses([medication], [], at(8, 31))[0].status).toBe('kacirildi');
  });

  it('onaylanmış doz "alindi"', () => {
    const logs = [log('ilac1', '2026-11-16', '08:00')];
    expect(service.getTodayDoses([medication], logs, at(12))[0].status).toBe('alindi');
  });

  it('ilaç eklenmeden önceki saat "yarin" sayılır', () => {
    const added = makeMedication({ createdAt: at(10).toISOString() });
    const [morning, evening] = service.getTodayDoses([added], [], at(10, 5));
    expect(morning.status).toBe('yarin');
    expect(evening.status).toBe('bekliyor');
  });

  it('gece yarısı gün değişince dünkü onay bugünü etkilemez', () => {
    const yesterdayLogs = [log('ilac1', '2026-11-16', '08:00')];
    const tomorrow = new Date(2026, 10, 17);
    const doses = service.getTodayDoses([medication], yesterdayLogs, at(0, 1, tomorrow));
    expect(doses[0].date).toBe('2026-11-17');
    expect(doses[0].status).toBe('bekliyor');
  });

  it('23:59 ile 00:01 farklı günlerin dozlarını verir', () => {
    const before = service.getTodayDoses([medication], [], at(23, 59));
    const after = service.getTodayDoses([medication], [], at(0, 1, new Date(2026, 10, 17)));
    expect(before[0].date).toBe('2026-11-16');
    expect(after[0].date).toBe('2026-11-17');
  });
});

describe('DoseService.confirmDose', () => {
  it('doz kaydını ve stok düşüşünü birlikte kaydeder', async () => {
    const { storage, service } = setup(at(8, 2));
    const state = { medications: [makeMedication({ stock: 10 })], doseLogs: [] };

    const next = await service.confirmDose(state, 'ilac1', '2026-11-16', '08:00');

    expect(next?.medications[0].stock).toBe(9);
    expect(next?.doseLogs).toEqual([
      {
        id: 'ilac1_2026-11-16_08:00',
        medicationId: 'ilac1',
        date: '2026-11-16',
        time: '08:00',
        takenAt: at(8, 2).toISOString(),
      },
    ]);
    expect(storage.saveCount).toBe(1);
    expect(storage.doseLogs).toEqual(next?.doseLogs);
  });

  it('aynı doz iki kez onaylanamaz, stok iki kez düşmez', async () => {
    const { storage, service } = setup();
    const first = await service.confirmDose(
      { medications: [makeMedication({ stock: 10 })], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );
    const second = await service.confirmDose(first!, 'ilac1', '2026-11-16', '08:00');

    expect(second).toBeNull();
    expect(storage.saveCount).toBe(1);
    expect(first?.medications[0].stock).toBe(9);
  });

  it('aynı saatin farklı günleri ayrı dozdur', async () => {
    const { service } = setup();
    const first = await service.confirmDose(
      { medications: [makeMedication({ stock: 10 })], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );
    const second = await service.confirmDose(first!, 'ilac1', '2026-11-17', '08:00');
    expect(second?.medications[0].stock).toBe(8);
  });

  it('stok sıfırken onaylanınca negatife düşmez', async () => {
    const { service } = setup();
    const next = await service.confirmDose(
      { medications: [makeMedication({ stock: 0 })], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );
    expect(next?.medications[0].stock).toBe(0);
    expect(next?.doseLogs).toHaveLength(1);
  });

  it('şurup gibi sayılamayan formda stok değişmez', async () => {
    const { service } = setup();
    const next = await service.confirmDose(
      { medications: [makeMedication({ form: 'syrup', stock: 3 })], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );
    expect(next?.medications[0].stock).toBe(3);
  });

  it('yalnızca onaylanan ilacın stoğu düşer', async () => {
    const { service } = setup();
    const other = makeMedication({ id: 'ilac2', stock: 5 });
    const next = await service.confirmDose(
      { medications: [makeMedication(), other], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );
    expect(next?.medications[1]).toBe(other);
  });

  it('ilaç bulunamazsa hiçbir şey yazılmaz', async () => {
    const { storage, service } = setup();
    const next = await service.confirmDose(
      { medications: [], doseLogs: [] },
      'yok',
      '2026-11-16',
      '08:00',
    );
    expect(next).toBeNull();
    expect(storage.saveCount).toBe(0);
  });

  it('kayıt başarısız olursa hata yukarı iletilir', async () => {
    const { storage, service } = setup();
    storage.failWrites = true;
    await expect(
      service.confirmDose(
        { medications: [makeMedication()], doseLogs: [] },
        'ilac1',
        '2026-11-16',
        '08:00',
      ),
    ).rejects.toThrow();
  });

  it('isTaken onay durumunu söyler', () => {
    const { service } = setup();
    const logs = [log('ilac1', '2026-11-16', '08:00')];
    expect(service.isTaken(logs, 'ilac1', '2026-11-16', '08:00')).toBe(true);
    expect(service.isTaken(logs, 'ilac1', '2026-11-16', '20:00')).toBe(false);
  });
});
