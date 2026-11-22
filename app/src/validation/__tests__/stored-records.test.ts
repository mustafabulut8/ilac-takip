import { formatDate } from '@/utils/date';

import { parseDoseLogRecord, parseMedicationRecord, sanitizeStock } from '../stored-records';

describe('parseMedicationRecord', () => {
  it('kimliği veya adı olmayan kayıt kullanılamaz', () => {
    expect(parseMedicationRecord(null)).toBeNull();
    expect(parseMedicationRecord('metin')).toBeNull();
    expect(parseMedicationRecord({ name: 'Aspirin' })).toBeNull();
    expect(parseMedicationRecord({ id: 'a', name: '' })).toBeNull();
    expect(parseMedicationRecord({ id: 5, name: 'Aspirin' })).toBeNull();
  });

  it('eksik alanları varsayılan değerle doldurur', () => {
    expect(parseMedicationRecord({ id: 'a', name: 'Aspirin' })).toEqual({
      id: 'a',
      name: 'Aspirin',
      dose: '',
      photoFile: '',
      times: [],
      stock: 0,
      createdAt: new Date(0).toISOString(),
      form: 'tablet',
      amount: 1,
      unit: 'adet',
      location: '',
      schedule: { kind: 'daily' },
      duration: { kind: 'continuous' },
      startDate: formatDate(new Date(0)),
      mealTiming: 'any',
      lowStockThreshold: 5,
      markedLow: false,
      pastPlans: [],
    });
  });

  it('bozuk saatleri atar, tekrarları kaldırır ve sıralar', () => {
    const record = parseMedicationRecord({
      id: 'a',
      name: 'Aspirin',
      times: ['20:00', 'saat', '08:00', '20:00', 7],
    });
    expect(record?.times).toEqual(['08:00', '20:00']);
  });

  it('bilinmeyen alanları korur (ileriki sürümlerden gelen veri kaybolmasın)', () => {
    const record = parseMedicationRecord({ id: 'a', name: 'Aspirin', note: 'tok karnına' });
    expect(record).toMatchObject({ note: 'tok karnına' });
  });
});

describe('parseMedicationRecord plan alanları', () => {
  const parse = (fields: Record<string, unknown>) =>
    parseMedicationRecord({ id: 'a', name: 'Aspirin', ...fields })!;

  it('geçerli plan korunur', () => {
    const plan = {
      schedule: { kind: 'weekdays', days: [1, 3] },
      duration: { kind: 'days', count: 7 },
      startDate: '2026-11-16',
      mealTiming: 'full',
      amount: 0.5,
    };
    expect(parse(plan)).toMatchObject(plan);
  });

  it('bozuk sıklık ve süre "her gün, sürekli" sayılır; hatırlatma kaybolmaz', () => {
    for (const schedule of [null, 'x', { kind: 'weekdays', days: [] }, { kind: 'weekdays' }]) {
      expect(parse({ schedule }).schedule).toEqual({ kind: 'daily' });
    }
    expect(parse({ schedule: { kind: 'weekdays', days: [9, 1, 1, '2'] } }).schedule).toEqual({
      kind: 'weekdays',
      days: [1],
    });
    for (const count of [0, -1, 2.5, '7']) {
      expect(parse({ duration: { kind: 'days', count } }).duration).toEqual({ kind: 'continuous' });
    }
  });

  it('bozuk başlangıç günü kayıt anından, bozuk miktar birden gelir', () => {
    const record = parse({
      createdAt: new Date(2026, 10, 1, 12).toISOString(),
      startDate: '2026-02-31',
      amount: -1,
      mealTiming: 'toString',
    });
    expect(record).toMatchObject({ startDate: '2026-11-01', amount: 1, mealTiming: 'any' });
    expect(parse({ createdAt: 'bozuk' }).startDate).toBe(formatDate(new Date(0)));
  });

  it('eski planlar bitiş sırasına dizilir, bitişi bozuk olan atılır', () => {
    const { pastPlans } = parse({
      pastPlans: [
        { times: ['08:00'], until: '2026-11-10T00:00:00.000Z' },
        { times: ['09:00'], until: '2026-11-05T00:00:00.000Z' },
        { times: ['10:00'], until: 'dün' },
        'x',
      ],
    });
    expect(pastPlans.map(({ times }) => times)).toEqual([['09:00'], ['08:00']]);
  });
});

describe('sanitizeStock', () => {
  it('stok negatif veya bozuksa sıfır olur', () => {
    expect(sanitizeStock(-3)).toBe(0);
    expect(sanitizeStock('10')).toBe(0);
    expect(sanitizeStock(Number.NaN)).toBe(0);
    expect(sanitizeStock(4.7)).toBe(4.5);
    expect(sanitizeStock(4.5)).toBe(4.5);
    expect(sanitizeStock(12)).toBe(12);
  });
});

describe('parseDoseLogRecord', () => {
  const log = { id: 'a_2026-11-16_08:00', medicationId: 'a', date: '2026-11-16', time: '08:00' };

  it('zorunlu alanları olan kaydı kabul eder', () => {
    expect(parseDoseLogRecord({ ...log, takenAt: 'x' })).toEqual({ ...log, takenAt: 'x' });
    expect(parseDoseLogRecord(log)?.takenAt).toBe('');
  });

  it('eksik alanlı kaydı reddeder', () => {
    expect(parseDoseLogRecord({ ...log, medicationId: undefined })).toBeNull();
    expect(parseDoseLogRecord([log])).toBeNull();
  });
});
