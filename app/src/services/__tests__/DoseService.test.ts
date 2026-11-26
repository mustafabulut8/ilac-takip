import { doseLogIdOf, type DoseLog } from '@/models';
import { FakeStorage, makeMedication } from '@/test-utils/fakes';

import { DoseCalculator } from '../DoseCalculator';
import { DoseService } from '../DoseService';
import { HistoryService } from '../HistoryService';

const TODAY = new Date(2026, 10, 16);
const at = (hour: number, minute = 0, day = TODAY) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);

function setup(now = at(9)) {
  const storage = new FakeStorage();
  const snoozes = { cancelSnooze: jest.fn().mockResolvedValue(undefined) };
  const calculator = new DoseCalculator();
  const service = new DoseService(storage, snoozes, calculator, () => now);
  return { storage, service, snoozes, calculator, history: new HistoryService(calculator) };
}

const log = (medicationId: string, date: string, time: string): DoseLog => ({
  id: doseLogIdOf(medicationId, date, time),
  medicationId,
  date,
  time,
  takenAt: '',
});

describe('doseLogIdOf', () => {
  it('ilaç, gün ve saatten belirleyici kimlik üretir', () => {
    expect(doseLogIdOf('ilac1', '2026-11-16', '08:00')).toBe('ilac1_2026-11-16_08:00');
    expect(doseLogIdOf('ilac1', '2026-11-16', '08:00')).toBe(
      doseLogIdOf('ilac1', '2026-11-16', '08:00'),
    );
  });
});

describe('DoseCalculator.getTodayDoses', () => {
  const { calculator } = setup();
  const medication = makeMedication({ times: ['20:00', '08:00'] });

  it('dozları saate göre sıralar ve bugünün tarihini verir', () => {
    const doses = calculator.getTodayDoses([medication], [], at(7));
    expect(doses.map((dose) => dose.time)).toEqual(['08:00', '20:00']);
    expect(doses.every((dose) => dose.date === '2026-11-16')).toBe(true);
  });

  it('saatinden önce ve 30 dakika içinde "bekliyor"', () => {
    expect(calculator.getTodayDoses([medication], [], at(7, 59))[0]?.status).toBe('bekliyor');
    expect(calculator.getTodayDoses([medication], [], at(8, 30))[0]?.status).toBe('bekliyor');
  });

  it('30 dakika geçince "kacirildi"', () => {
    expect(calculator.getTodayDoses([medication], [], at(8, 31))[0]?.status).toBe('kacirildi');
  });

  it('onaylanmış doz "alindi"', () => {
    const logs = [log('ilac1', '2026-11-16', '08:00')];
    expect(calculator.getTodayDoses([medication], logs, at(12))[0]?.status).toBe('alindi');
  });

  it('ilaç eklenmeden önceki saat "yarin" sayılır', () => {
    const added = makeMedication({ createdAt: at(10).toISOString() });
    const [morning, evening] = calculator.getTodayDoses([added], [], at(10, 5));
    expect(morning?.status).toBe('yarin');
    expect(evening?.status).toBe('bekliyor');
  });

  it('gece yarısı gün değişince dünkü onay bugünü etkilemez', () => {
    const yesterdayLogs = [log('ilac1', '2026-11-16', '08:00')];
    const tomorrow = new Date(2026, 10, 17);
    const doses = calculator.getTodayDoses([medication], yesterdayLogs, at(0, 1, tomorrow));
    expect(doses[0]?.date).toBe('2026-11-17');
    expect(doses[0]?.status).toBe('bekliyor');
  });

  it('23:59 ile 00:01 farklı günlerin dozlarını verir', () => {
    const before = calculator.getTodayDoses([medication], [], at(23, 59));
    const after = calculator.getTodayDoses([medication], [], at(0, 1, new Date(2026, 10, 17)));
    expect(before[0]?.date).toBe('2026-11-16');
    expect(after[0]?.date).toBe('2026-11-17');
  });
});

describe('DoseCalculator sıklık ve süre (#23)', () => {
  const { calculator } = setup();
  // 16 Kasım 2026 Pazartesi
  const on = (day: number) => new Date(2026, 10, day);
  const timesOn = (day: number, medication: ReturnType<typeof makeMedication>) =>
    calculator.getDosesOn(on(day), [medication], [], at(23, 59, on(30))).map((dose) => dose.time);

  it('seçilmeyen günde doz yoktur, kaçırılmış sayılmaz', () => {
    const medication = makeMedication({
      times: ['08:00'],
      schedule: { kind: 'weekdays', days: [1, 3] },
    });
    expect(timesOn(16, medication)).toEqual(['08:00']);
    expect(timesOn(17, medication)).toEqual([]);
    expect(timesOn(18, medication)).toEqual(['08:00']);
  });

  it('süre dışındaki günlerde doz yoktur', () => {
    const medication = makeMedication({
      times: ['08:00'],
      duration: { kind: 'days', count: 2 },
      startDate: '2026-11-17',
    });
    expect([16, 17, 18, 19].map((day) => timesOn(day, medication).length)).toEqual([0, 1, 1, 0]);
  });

  it('plan değişince geçmiş günler eski plana göre hesaplanır', () => {
    const medication = makeMedication({
      times: ['09:00', '21:00'],
      pastPlans: [
        {
          times: ['08:00', '20:00'],
          schedule: { kind: 'daily' },
          duration: { kind: 'continuous' },
          startDate: '2026-01-01',
          until: at(10, 0, on(16)).toISOString(),
        },
      ],
    });
    expect(timesOn(15, medication)).toEqual(['08:00', '20:00']);
    // Değişiklik günü: geçen saat eski plandan, kalan saat yeni plandan gelir.
    expect(timesOn(16, medication)).toEqual(['08:00', '21:00']);
    expect(timesOn(17, medication)).toEqual(['09:00', '21:00']);
  });

  it('erken alınıp planı değişen doz kaybolmaz', () => {
    const medication = makeMedication({
      times: ['21:00'],
      pastPlans: [
        {
          times: ['20:00'],
          schedule: { kind: 'daily' },
          duration: { kind: 'continuous' },
          startDate: '2026-01-01',
          until: at(19, 50).toISOString(),
        },
      ],
    });
    const doses = calculator.getTodayDoses(
      [medication],
      [log('ilac1', '2026-11-16', '20:00')],
      at(19, 55),
    );
    expect(doses.map(({ time, status }) => [time, status])).toEqual([
      ['20:00', 'alindi'],
      ['21:00', 'bekliyor'],
    ]);
  });
});

describe('DoseCalculator ve HistoryService: ilerleme ve geçmiş', () => {
  const { calculator, history } = setup();
  const medication = makeMedication();

  it('günün ilerlemesini ve sıradaki dozu verir', () => {
    const doses = calculator.getTodayDoses(
      [medication],
      [log('ilac1', '2026-11-16', '08:00')],
      at(9),
    );
    expect(calculator.progressOf(doses)).toEqual({ total: 2, taken: 1, remaining: 1, percent: 50 });
    expect(calculator.nextPending(doses)?.time).toBe('20:00');
    expect(calculator.progressOf([]).percent).toBe(0);
    expect(calculator.nextPending([])).toBeUndefined();
  });

  it('dozları gün dilimlerine ayırır, boş grubu vermez', () => {
    const late = makeMedication({ times: ['02:00', '08:00', '22:00'] });
    const groups = calculator.groupByPeriod(calculator.getTodayDoses([late], [], at(9)));
    expect(groups.map(({ period, doses }) => [period, doses.map(({ time }) => time)])).toEqual([
      ['morning', ['08:00']],
      ['evening', ['02:00', '22:00']],
    ]);
  });

  it('haftanın günlerini ve uyumu hesaplar', () => {
    const added = makeMedication({ createdAt: at(0).toISOString() });
    const logs = [
      log('ilac1', '2026-11-16', '08:00'),
      log('ilac1', '2026-11-16', '20:00'),
      log('ilac1', '2026-11-17', '08:00'),
      log('ilac1', '2026-11-19', '08:00'),
    ];
    const week = history.getWeek(TODAY, [added], logs, at(9, 0, new Date(2026, 10, 19)));

    expect(week.days.map(({ summary }) => summary)).toEqual([
      'all',
      'some',
      'none',
      'open',
      'open',
      'open',
      'open',
    ]);
    expect(week).toMatchObject({ taken: 4, missed: 3, adherence: 57 });
  });

  it('eklenmeden önceki günler boştur, uyum hesaplanmaz', () => {
    const added = makeMedication({ createdAt: at(10).toISOString() });
    const week = history.getWeek(new Date(2026, 10, 9), [added], [], at(11));
    expect(week.days.every(({ doses, summary }) => doses.length === 0 && summary === 'open')).toBe(
      true,
    );
    expect(week.adherence).toBeNull();
  });

  it('ilk ilacın eklendiği haftadan öncesine gidilemez', () => {
    const added = makeMedication({ createdAt: at(10).toISOString() });
    expect(history.hasHistoryBefore(TODAY, [added])).toBe(false);
    expect(history.hasHistoryBefore(new Date(2026, 10, 23), [added])).toBe(true);
    expect(history.hasHistoryBefore(TODAY, [])).toBe(false);
  });

  it('alınan dozun onay anını taşır', () => {
    const takenAt = at(8, 4).toISOString();
    const [dose] = calculator.getTodayDoses(
      [medication],
      [{ ...log('ilac1', '2026-11-16', '08:00'), takenAt }],
      at(9),
    );
    expect(dose?.takenAt).toBe(takenAt);
  });
});

describe('DoseService.confirmDose', () => {
  it('ertelenmiş bildirimi kaldırır; kaldırılamazsa onay bozulmaz', async () => {
    const { service, snoozes } = setup();
    snoozes.cancelSnooze.mockRejectedValue(new Error('bildirim yok'));
    const next = await service.confirmDose(
      { medications: [makeMedication()], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );
    expect(next?.doseLogs).toHaveLength(1);
    expect(snoozes.cancelSnooze).toHaveBeenCalledWith('ilac1', '2026-11-16', '08:00');
  });

  it('yarım tablet stoktan yarım düşer', async () => {
    const { service } = setup();
    const next = await service.confirmDose(
      { medications: [makeMedication({ stock: 10, amount: 0.5 })], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );
    expect(next?.medications[0]?.stock).toBe(9.5);
  });

  it('doz kaydını ve stok düşüşünü birlikte kaydeder', async () => {
    const { storage, service } = setup(at(8, 2));
    const state = { medications: [makeMedication({ stock: 10 })], doseLogs: [] };

    const next = await service.confirmDose(state, 'ilac1', '2026-11-16', '08:00');

    expect(next?.medications[0]?.stock).toBe(9);
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
    expect(first?.medications[0]?.stock).toBe(9);
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
    expect(second?.medications[0]?.stock).toBe(8);
  });

  it('stok sıfırken onaylanınca negatife düşmez', async () => {
    const { service } = setup();
    const next = await service.confirmDose(
      { medications: [makeMedication({ stock: 0 })], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );
    expect(next?.medications[0]?.stock).toBe(0);
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
    expect(next?.medications[0]?.stock).toBe(3);
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
    const { calculator } = setup();
    const logs = [log('ilac1', '2026-11-16', '08:00')];
    expect(calculator.isTaken(logs, 'ilac1', '2026-11-16', '08:00')).toBe(true);
    expect(calculator.isTaken(logs, 'ilac1', '2026-11-16', '20:00')).toBe(false);
    expect(calculator.logIdOf('ilac1', '2026-11-16', '08:00')).toBe(logs[0]?.id);
  });
});

describe('DoseCalculator.focusDose', () => {
  const { calculator } = setup();
  const medication = makeMedication({ times: ['08:00', '13:00', '20:00'] });
  const today = '2026-11-16';
  const focusAt = (now: Date, logs: DoseLog[] = []) =>
    calculator.focusDose(calculator.getTodayDoses([medication], logs, now), now)?.time;

  it('saati gelmemişse sıradaki dozu gösterir', () => {
    expect(focusAt(at(7))).toBe('08:00');
  });

  it('saati geçmiş ama alınmamış dozu gösterir; kaçırılmış olsa bile', () => {
    expect(focusAt(at(8, 10))).toBe('08:00');
    expect(focusAt(at(10))).toBe('08:00');
  });

  it('yeni dozun saati gelince en son geciken doz gösterilir', () => {
    expect(focusAt(at(13, 5))).toBe('13:00');
  });

  it('alınan dozdan sonra sıradakine geçer', () => {
    expect(focusAt(at(9), [log(medication.id, today, '08:00')])).toBe('13:00');
  });

  it('hepsi alındıysa doz göstermez', () => {
    const logs = ['08:00', '13:00', '20:00'].map((time) => log(medication.id, today, time));
    expect(focusAt(at(21), logs)).toBeUndefined();
  });
});
