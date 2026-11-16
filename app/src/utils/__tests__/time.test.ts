import { formatTime, isValidTime, parseTime } from '../time';

describe('isValidTime', () => {
  it.each(['00:00', '08:05', '12:30', '23:59'])('%s geçerli', (value) => {
    expect(isValidTime(value)).toBe(true);
  });

  it.each(['24:00', '8:05', '12:60', '1230', '', 'ab:cd', null, 830])('%s geçersiz', (value) => {
    expect(isValidTime(value)).toBe(false);
  });
});

describe('formatTime / parseTime', () => {
  it('saat ve dakikayı iki haneye tamamlar', () => {
    expect(formatTime(8, 5)).toBe('08:05');
    expect(formatTime(23, 0)).toBe('23:00');
  });

  it('metni saat ve dakikaya ayırır', () => {
    expect(parseTime('08:30')).toEqual({ hour: 8, minute: 30 });
  });
});
