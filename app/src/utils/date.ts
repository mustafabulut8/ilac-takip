import { parseTime } from './time';

/** Yerel saate göre YYYY-MM-DD. toISOString kullanılmaz; o UTC verir ve gece yarısı günü kaydırır. */
export function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Verilen günün, verilen HH:mm saatindeki yerel zamanı. */
export function atTime(day: Date, time: string) {
  const { hour, minute } = parseTime(time);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}
