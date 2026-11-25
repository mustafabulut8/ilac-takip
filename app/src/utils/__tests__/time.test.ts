import { formatMinutes, formatTime, greetingFor, isValidTime, parseTime } from '../time';

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

describe('greetingFor', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 10, 26, hour, minute);

  it('saat aralıklarının sınırlarında doğru selamlar', () => {
    expect(greetingFor(at(4, 59), 'Ayşe')).toBe('İyi akşamlar Ayşe');
    expect(greetingFor(at(5), 'Ayşe')).toBe('Günaydın Ayşe');
    expect(greetingFor(at(10, 59), 'Ayşe')).toBe('Günaydın Ayşe');
    expect(greetingFor(at(11), 'Ayşe')).toBe('İyi günler Ayşe');
    expect(greetingFor(at(16, 59), 'Ayşe')).toBe('İyi günler Ayşe');
    expect(greetingFor(at(17), 'Ayşe')).toBe('İyi akşamlar Ayşe');
    expect(greetingFor(at(23, 59), 'Ayşe')).toBe('İyi akşamlar Ayşe');
  });

  it('adın fazla boşluklarını temizler; ad yoksa yalnızca selam verir', () => {
    expect(greetingFor(at(8), '  Ayşe   Nur ')).toBe('Günaydın Ayşe Nur');
    expect(greetingFor(at(8), '   ')).toBe('Günaydın');
    expect(greetingFor(at(8), null)).toBe('Günaydın');
    expect(greetingFor(at(8))).toBe('Günaydın');
  });
});

describe('formatMinutes', () => {
  it('dakika ve saati okunur yazar', () => {
    expect(formatMinutes(45)).toBe('45 dakika');
    expect(formatMinutes(120)).toBe('2 saat');
    expect(formatMinutes(130)).toBe('2 saat 10 dakika');
    expect(formatMinutes(-5)).toBe('0 dakika');
  });
});
