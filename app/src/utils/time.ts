const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "08:30" gibi 24 saatlik HH:mm biçimi mi? */
export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

/** Saat ve dakikayı "08:05" biçimine çevirir. */
export function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** "08:30" → { hour: 8, minute: 30 } */
export function parseTime(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

export type DayPeriod = 'morning' | 'noon' | 'evening';

/** Bugün ekranındaki gruplar, ekrandaki sırasıyla. */
export const DAY_PERIODS: readonly DayPeriod[] = ['morning', 'noon', 'evening'];

export const DAY_PERIOD_LABELS: Record<DayPeriod, string> = {
  morning: 'Sabah',
  noon: 'Öğle',
  evening: 'Akşam & Gece',
};

export const DAY_PERIOD_RANGES: Record<DayPeriod, string> = {
  morning: '05:00 – 11:00',
  noon: '11:00 – 17:00',
  evening: '17:00 – 05:00',
};

/** "08:00" → morning. Gece yarısından 05:00'e kadar olan saatler de akşam grubundadır. */
export function dayPeriodOf(time: string): DayPeriod {
  const { hour } = parseTime(time);
  if (hour < 5 || hour >= 17) return 'evening';
  return hour < 11 ? 'morning' : 'noon';
}

/** Saate göre selamlama. */
export function greetingOf(now: Date) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) return 'Günaydın';
  return hour >= 11 && hour < 17 ? 'İyi günler' : 'İyi akşamlar';
}
