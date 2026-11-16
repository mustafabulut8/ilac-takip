import { atTime, formatDate } from '../date';

describe('formatDate', () => {
  it('yerel tarihi YYYY-MM-DD biçiminde verir', () => {
    expect(formatDate(new Date(2026, 10, 16, 9, 30))).toBe('2026-11-16');
  });

  it('ay ve günü iki haneye tamamlar', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('gece yarısında gün değişir', () => {
    expect(formatDate(new Date(2026, 10, 16, 23, 59, 59))).toBe('2026-11-16');
    expect(formatDate(new Date(2026, 10, 17, 0, 0, 0))).toBe('2026-11-17');
  });

  it('yıl sonunda yeni yıla geçer', () => {
    expect(formatDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    expect(formatDate(new Date(2027, 0, 1, 0, 1))).toBe('2027-01-01');
  });
});

describe('atTime', () => {
  it('verilen günün verilen saatini döner', () => {
    const result = atTime(new Date(2026, 10, 16, 15, 45), '08:30');
    expect(result).toEqual(new Date(2026, 10, 16, 8, 30));
  });
});
