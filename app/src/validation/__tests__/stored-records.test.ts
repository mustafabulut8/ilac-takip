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

describe('sanitizeStock', () => {
  it('stok negatif veya bozuksa sıfır olur', () => {
    expect(sanitizeStock(-3)).toBe(0);
    expect(sanitizeStock('10')).toBe(0);
    expect(sanitizeStock(Number.NaN)).toBe(0);
    expect(sanitizeStock(4.7)).toBe(4);
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
