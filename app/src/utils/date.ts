import { parseTime } from './time';

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/** Date.getDay sırası: 0 Pazar. */
export const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const WEEKDAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
/** Haftanın ekranlardaki sırası: Pazartesiden Pazara. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Yerel saate göre YYYY-MM-DD. toISOString kullanılmaz; o UTC verir ve gece yarısı günü kaydırır. */
export function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-11-22" → o günün yerel gece yarısı; biçim bozuksa veya gün yoksa null. */
export function parseDate(text: unknown): Date | null {
  const match = typeof text === 'string' ? DATE_PATTERN.exec(text) : null;
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatDate(date) === text ? date : null;
}

/** Günün başlangıcından `days` gün sonrası; yaz saati geçişinden etkilenmez. */
export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Haftanın Pazartesi günü. */
export function startOfWeek(date: Date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

/** "22 Kasım" */
export function formatDayMonth(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "22 Kasım Pazar" */
export function formatLongDate(date: Date) {
  return `${formatDayMonth(date)} ${WEEKDAYS[date.getDay()]}`;
}

/** "16 – 22 Kasım"; aylar farklıysa "30 Kasım – 6 Aralık". */
export function formatDateRange(first: Date, last: Date) {
  const start =
    first.getMonth() === last.getMonth() ? String(first.getDate()) : formatDayMonth(first);
  return `${start} – ${formatDayMonth(last)}`;
}

/** Verilen günün, verilen HH:mm saatindeki yerel zamanı. */
export function atTime(day: Date, time: string) {
  const { hour, minute } = parseTime(time);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}
