import { doseLogIdOf } from '@/models';
import { FakeStorage, makeMedication } from '@/test-utils/fakes';
import { atTime, parseDate } from '@/utils/date';

import { DoseCalculator } from '../DoseCalculator';
import { DoseService } from '../DoseService';
import { HistoryService } from '../HistoryService';
import { ReminderPlanner } from '../ReminderPlanner';

const calculator = new DoseCalculator();
const day = (date: string) => parseDate(date)!;
const moment = (date: string, time: string) => atTime(day(date), time);
const statusAt = (date: string, time: string, now: Date, medication = makeMedication()) =>
  calculator.getDosesOn(day(date), [medication], [], now).find((dose) => dose.time === time)
    ?.status;

describe('gece yarısını aşan dozlar', () => {
  const late = makeMedication({ times: ['23:50'] });

  it('23:50 dozu gece yarısından sonra 30 dakika dolana kadar bekler, sonra kaçırılır', () => {
    expect(statusAt('2026-11-16', '23:50', moment('2026-11-17', '00:19'), late)).toBe('bekliyor');
    expect(statusAt('2026-11-16', '23:50', moment('2026-11-17', '00:21'), late)).toBe('kacirildi');
  });

  it('dünün dozu bugünün listesine girmez; bugünün 23:50 dozu bekler', () => {
    const today = calculator.getTodayDoses([late], [], moment('2026-11-17', '00:10'));
    expect(today).toEqual([expect.objectContaining({ date: '2026-11-17', status: 'bekliyor' })]);
  });

  it('gece yarısından sonra onaylanan dün akşamki doz dünün günüyle kaydedilir', async () => {
    const storage = new FakeStorage();
    const now = moment('2026-11-17', '00:05');
    const service = new DoseService(
      storage,
      { cancelSnooze: jest.fn().mockResolvedValue(undefined) },
      calculator,
      () => now,
    );
    const next = await service.confirmDose(
      { medications: [late], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '23:50',
    );
    expect(next?.doseLogs[0]).toMatchObject({ id: 'ilac1_2026-11-16_23:50', date: '2026-11-16' });
    expect(statusAt('2026-11-17', '23:50', now, late)).toBe('bekliyor');
  });
});

describe('haftanın belirli günleri ve süre', () => {
  // 16 Kasım 2026 Pazartesi.
  const mondayWednesday = makeMedication({
    times: ['09:00'],
    schedule: { kind: 'weekdays', days: [1, 3] },
  });

  it('yalnızca seçili günlerde doz vardır; geçmiş hafta uyumu yalnızca o günlerden sayılır', () => {
    const now = moment('2026-11-22', '12:00');
    const week = new HistoryService(calculator).getWeek(
      day('2026-11-16'),
      [mondayWednesday],
      [],
      now,
    );
    expect(week.days.map((item) => item.doses.length)).toEqual([1, 0, 1, 0, 0, 0, 0]);
    expect(week).toMatchObject({ taken: 0, missed: 2, adherence: 0 });
  });

  it('süreli kürde son gün doz vardır, ertesi gün yoktur', () => {
    const course = makeMedication({
      startDate: '2026-11-10',
      duration: { kind: 'days', count: 7 },
    });
    const now = moment('2026-11-17', '12:00');
    expect(calculator.getDosesOn(day('2026-11-16'), [course], [], now)).toHaveLength(2);
    expect(calculator.getDosesOn(day('2026-11-17'), [course], [], now)).toHaveLength(0);
    expect(calculator.getDosesOn(day('2026-11-09'), [course], [], now)).toHaveLength(0);
  });

  it('aynı doz iki kez kaydedilmez; aynı kimlikli kayıt yalnızca bir doz sayılır', () => {
    const log = {
      id: doseLogIdOf('ilac1', '2026-11-16', '08:00'),
      medicationId: 'ilac1',
      date: '2026-11-16',
      time: '08:00',
      takenAt: '',
    };
    const doses = calculator.getDosesOn(
      day('2026-11-16'),
      [makeMedication()],
      [log, { ...log }],
      moment('2026-11-16', '12:00'),
    );
    expect(doses.map((dose) => dose.time)).toEqual(['08:00', '20:00']);
    expect(calculator.progressOf(doses)).toMatchObject({ total: 2, taken: 1 });
  });
});

// Testler jest.global-setup.js ile Europe/Berlin diliminde çalışır.
describe('yaz/kış saati (Avrupa/Berlin)', () => {
  it('testler geçişi olan saat diliminde çalışıyor', () => {
    expect(new Date(2026, 2, 29, 2, 30).getHours()).toBe(3);
  });

  it('saatler ileri alınan gün (29 Mart 2026) 08:00 dozu yerel saatle hesaplanır', () => {
    expect(statusAt('2026-03-29', '08:00', moment('2026-03-29', '08:29'))).toBe('bekliyor');
    expect(statusAt('2026-03-29', '08:00', moment('2026-03-29', '08:31'))).toBe('kacirildi');
  });

  it('olmayan 02:30 dozu bir kez sayılır ve 03:30 gibi davranır', () => {
    const night = makeMedication({ times: ['02:30'] });
    const doses = calculator.getDosesOn(
      day('2026-03-29'),
      [night],
      [],
      moment('2026-03-29', '04:01'),
    );
    expect(doses).toEqual([expect.objectContaining({ time: '02:30', status: 'kacirildi' })]);
    expect(statusAt('2026-03-29', '02:30', moment('2026-03-29', '03:59'), night)).toBe('bekliyor');
  });

  it('saatler geri alınan gün (25 Ekim 2026) iki kez yaşanan 02:30 dozu bir kez sayılır', () => {
    const night = makeMedication({ times: ['02:30'] });
    const doses = calculator.getDosesOn(
      day('2026-10-25'),
      [night],
      [],
      moment('2026-10-25', '12:00'),
    );
    expect(doses).toHaveLength(1);
  });

  it('geçiş haftasında Geçmiş yedi ayrı gün gösterir', () => {
    const week = new HistoryService(calculator).getWeek(
      day('2026-03-23'),
      [makeMedication()],
      [],
      moment('2026-03-30', '12:00'),
    );
    expect(week.days.map((item) => item.date)).toEqual([
      '2026-03-23',
      '2026-03-24',
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
      '2026-03-28',
      '2026-03-29',
    ]);
    expect(week.missed).toBe(14);
  });

  it('süreli kürün bildirimleri geçişten sonra da yerel 08:00’de kurulur', () => {
    const course = makeMedication({
      times: ['08:00'],
      startDate: '2026-03-28',
      duration: { kind: 'days', count: 3 },
    });
    const reminders = new ReminderPlanner().plan([course], moment('2026-03-28', '00:00'));
    expect(reminders.map((reminder) => reminder.identifier)).toEqual([
      'ilac1-08:00-2026-03-28',
      'ilac1-08:00-2026-03-29',
      'ilac1-08:00-2026-03-30',
    ]);
    expect(reminders.map((reminder) => reminder.at?.getHours())).toEqual([8, 8, 8]);
  });
});
