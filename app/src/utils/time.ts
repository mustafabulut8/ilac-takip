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
  const [hour = Number.NaN, minute = Number.NaN] = time.split(':').map(Number);
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

/**
 * Saate göre selamlama: 05:00-11:00 "Günaydın", 11:00-17:00 "İyi günler",
 * 17:00-05:00 "İyi akşamlar". Aralıklar Bugün ekranındaki gruplarla aynıdır.
 */
export function greetingOf(now: Date) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) return 'Günaydın';
  return hour >= 11 && hour < 17 ? 'İyi günler' : 'İyi akşamlar';
}

/** "Günaydın Mustafa"; ad bilinmiyorsa yalnızca selamlama. Addaki fazla boşluklar atılır. */
export function greetingFor(now: Date, name?: string | null) {
  const trimmed = name?.trim().replace(/\s+/g, ' ');
  return trimmed ? `${greetingOf(now)} ${trimmed}` : greetingOf(now);
}

/** Süreyi okunur yazar: 45 → "45 dakika", 120 → "2 saat", 130 → "2 saat 10 dakika". */
export function formatMinutes(minutes: number) {
  const total = Math.max(0, Math.floor(minutes));
  if (total < 60) return `${total} dakika`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} saat` : `${hours} saat ${rest} dakika`;
}
