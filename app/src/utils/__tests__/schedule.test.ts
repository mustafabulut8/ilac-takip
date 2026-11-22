import type { DosePlan } from '@/models';

import { addDays, formatDateRange, formatLongDate, parseDate, startOfWeek } from '../date';
import {
  describeDuration,
  describeSchedule,
  isScheduledOn,
  lastDayOf,
  nextOccurrence,
} from '../schedule';
import { dayPeriodOf, greetingOf } from '../time';

const plan: DosePlan = {
  times: ['08:00', '20:00'],
  schedule: { kind: 'daily' },
  duration: { kind: 'continuous' },
  startDate: '2026-11-16',
};
// 16 Kasım 2026 Pazartesi
const monday = new Date(2026, 10, 16);

describe('plan', () => {
  it('sürekli kullanımın son günü yoktur, süreli kullanımınki sayılır', () => {
    expect(lastDayOf(plan)).toBeNull();
    expect(lastDayOf({ ...plan, duration: { kind: 'days', count: 7 } })).toEqual(
      new Date(2026, 10, 22),
    );
  });

  it('gün ve süre kuralı birlikte uygulanır', () => {
    const rule: DosePlan = {
      ...plan,
      schedule: { kind: 'weekdays', days: [1] },
      duration: { kind: 'days', count: 7 },
    };
    expect(isScheduledOn(rule, monday)).toBe(true);
    expect(isScheduledOn(rule, addDays(monday, 1))).toBe(false);
    expect(isScheduledOn(rule, addDays(monday, 7))).toBe(false);
  });

  it('sonraki dozu bulur', () => {
    expect(nextOccurrence(plan, new Date(2026, 10, 16, 9))).toEqual(new Date(2026, 10, 16, 20));
    expect(nextOccurrence(plan, new Date(2026, 10, 16, 21))).toEqual(new Date(2026, 10, 17, 8));
    const weekly: DosePlan = { ...plan, schedule: { kind: 'weekdays', days: [0] } };
    expect(nextOccurrence(weekly, new Date(2026, 10, 16, 9))).toEqual(new Date(2026, 10, 22, 8));
    expect(nextOccurrence({ ...plan, startDate: '2026-12-01' }, monday)).toEqual(
      new Date(2026, 11, 1, 8),
    );
    const finished: DosePlan = { ...plan, duration: { kind: 'days', count: 1 } };
    expect(nextOccurrence(finished, new Date(2026, 10, 17))).toBeNull();
  });

  it('Türkçe açıklama verir, günler Pazartesiden başlar', () => {
    expect(describeSchedule(plan)).toBe('Her gün');
    expect(describeSchedule({ schedule: { kind: 'weekdays', days: [0, 1, 3] } })).toBe(
      'Pzt, Çar, Paz',
    );
    expect(describeDuration(plan)).toBe('Sürekli kullanım');
    expect(describeDuration({ duration: { kind: 'days', count: 7 } })).toBe('7 gün');
  });
});

describe('tarih ve saat metinleri', () => {
  it('geçerli günü okur, olmayan günü reddeder', () => {
    expect(parseDate('2026-11-16')).toEqual(monday);
    for (const text of ['2026-02-31', '16.11.2026', '', null, 5]) {
      expect(parseDate(text)).toBeNull();
    }
  });

  it('hafta Pazartesi başlar', () => {
    expect(startOfWeek(new Date(2026, 10, 22, 23, 59))).toEqual(monday);
    expect(startOfWeek(monday)).toEqual(monday);
  });

  it('Türkçe tarih yazar', () => {
    expect(formatLongDate(new Date(2026, 10, 22))).toBe('22 Kasım Pazar');
    expect(formatDateRange(monday, addDays(monday, 6))).toBe('16 – 22 Kasım');
    expect(formatDateRange(new Date(2026, 10, 30), new Date(2026, 11, 6))).toBe(
      '30 Kasım – 6 Aralık',
    );
  });

  it('saati gün dilimine ayırır', () => {
    expect(['04:59', '05:00', '10:59', '11:00', '16:59', '17:00'].map(dayPeriodOf)).toEqual([
      'evening',
      'morning',
      'morning',
      'noon',
      'noon',
      'evening',
    ]);
  });

  it('saate göre selamlar', () => {
    const at = (hour: number) => greetingOf(new Date(2026, 10, 16, hour));
    expect([at(8), at(13), at(20), at(2)]).toEqual([
      'Günaydın',
      'İyi günler',
      'İyi akşamlar',
      'İyi akşamlar',
    ]);
  });
});
