import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  getMedicationForm,
  MEAL_TIMING_LABELS,
  type DoseLog,
  type Duration,
  type Schedule,
  type MealTiming,
  type Medication,
  type PastPlan,
  type DosePlan,
} from '@/models';
import { formatDate, parseDate } from '@/utils/date';
import { isRecord } from '@/utils/json';
import { isValidTime } from '@/utils/time';

/** Tarih bilinmiyorsa en eski tarih kullanılır; böylece dozlar "yarın başlıyor" görünmez. */
const UNKNOWN_CREATED_AT = new Date(0).toISOString();

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

/** Stok negatif veya sayı değilse sıfır olur; yarım tablet için 0,5'in katına yuvarlanır. */
export function sanitizeStock(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(Math.floor(value * 2) / 2, 0);
}

function sanitizeAmount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 1;
}

/** null bilinçli olarak kapatılmış uyarıdır; bozuk değer varsayılana döner. */
function sanitizeThreshold(value: unknown): number | null {
  if (value === null) return null;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_LOW_STOCK_THRESHOLD;
}

export function isWeekday(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 6;
}

/** Bozuk veya boş sıklık "her gün" sayılır; hatırlatma sessizce kaybolmasın. */
function sanitizeSchedule(value: unknown): Schedule {
  if (!isRecord(value) || value.kind !== 'weekdays' || !Array.isArray(value.days)) {
    return { kind: 'daily' };
  }
  const days = [...new Set(value.days.filter(isWeekday))].sort();
  return days.length > 0 && days.length < 7 ? { kind: 'weekdays', days } : { kind: 'daily' };
}

function sanitizeDuration(value: unknown): Duration {
  if (!isRecord(value) || value.kind !== 'days') return { kind: 'continuous' };
  const { count } = value;
  return typeof count === 'number' && Number.isInteger(count) && count > 0
    ? { kind: 'days', count }
    : { kind: 'continuous' };
}

/** Kayıt anının yerel günü; kayıt anı bozuksa en eski gün. */
export function startDateOf(createdAt: unknown): string {
  const date = new Date(typeof createdAt === 'string' ? createdAt : UNKNOWN_CREATED_AT);
  return formatDate(Number.isNaN(date.getTime()) ? new Date(0) : date);
}

function sanitizePlan(value: Record<string, unknown>, createdAt: unknown): DosePlan {
  return {
    times: sanitizeTimes(value.times),
    schedule: sanitizeSchedule(value.schedule),
    duration: sanitizeDuration(value.duration),
    startDate: parseDate(value.startDate) ? (value.startDate as string) : startDateOf(createdAt),
  };
}

/** Bitiş anı okunamayan eski plan kullanılamaz. Planlar bitiş sırasına dizilir. */
function sanitizePastPlans(value: unknown, createdAt: unknown): PastPlan[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .filter((item) => typeof item.until === 'string' && !Number.isNaN(Date.parse(item.until)))
    .map((item) => ({ ...sanitizePlan(item, createdAt), until: item.until as string }))
    .sort((a, b) => Date.parse(a.until) - Date.parse(b.until));
}

function isMealTiming(value: unknown): value is MealTiming {
  return typeof value === 'string' && Object.hasOwn(MEAL_TIMING_LABELS, value);
}

function sanitizeTimes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isValidTime))].sort();
}

/**
 * Telefondan okunan tek bir ilaç kaydını denetler. Kimliği veya adı olmayan kayıt
 * kullanılamaz (`null`); diğer eksik alanlar varsayılan değerle doldurulur.
 */
export function parseMedicationRecord(value: unknown): Medication | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.name)) {
    return null;
  }
  return {
    ...value,
    id: value.id,
    name: value.name,
    dose: stringOr(value.dose, ''),
    photoFile: stringOr(value.photoFile, ''),
    ...sanitizePlan(value, value.createdAt),
    stock: sanitizeStock(value.stock),
    createdAt: isNonEmptyString(value.createdAt) ? value.createdAt : UNKNOWN_CREATED_AT,
    form: getMedicationForm(value.form).kind,
    amount: sanitizeAmount(value.amount),
    unit: stringOr(value.unit, 'adet'),
    location: stringOr(value.location, ''),
    mealTiming: isMealTiming(value.mealTiming) ? value.mealTiming : 'any',
    lowStockThreshold: sanitizeThreshold(value.lowStockThreshold),
    markedLow: value.markedLow === true,
    pastPlans: sanitizePastPlans(value.pastPlans, value.createdAt),
  };
}

/** Telefondan okunan tek bir doz kaydını denetler; eksik alanlı kayıt kullanılamaz. */
export function parseDoseLogRecord(value: unknown): DoseLog | null {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.medicationId) ||
    !isNonEmptyString(value.date) ||
    !isNonEmptyString(value.time)
  ) {
    return null;
  }
  return {
    ...value,
    id: value.id,
    medicationId: value.medicationId,
    date: value.date,
    time: value.time,
    takenAt: stringOr(value.takenAt, ''),
  };
}
