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
