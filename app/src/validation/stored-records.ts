import { z } from 'zod';

import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  getMedicationForm,
  type DoseLog,
  type DosePlan,
  type Duration,
  type Medication,
  type PastPlan,
  type Schedule,
} from '@/models';
import { formatDate, parseDate } from '@/utils/date';
import { logger } from '@/utils/logger';

import {
  describeIssues,
  instantSchema,
  matches,
  mealTimingSchema,
  nonEmptyTextSchema,
  timeSchema,
  weekdaySchema,
} from './schemas';

/**
 * Telefondan okunan kayıtların şemaları. Kural: kimliği veya adı olmayan kayıt
 * kullanılamaz; diğer bozuk alanlar çökmeye yol açmaz, güvenli varsayılana döner
 * (`.catch`). Bilinmeyen alanlar korunur; eski veya yeni sürümün eklediği alan kaybolmaz.
 */

/** Tarih bilinmiyorsa en eski tarih kullanılır; böylece dozlar "yarın başlıyor" görünmez. */
const UNKNOWN_CREATED_AT = new Date(0).toISOString();

/** Stok negatif veya sayı değilse sıfır olur; yarım tablet için 0,5'in katına yuvarlanır. */
export function sanitizeStock(value: unknown): number {
  return stockSchema.parse(value);
}

const stockSchema = z
  .number()
  .finite()
  .transform((value) => Math.max(Math.floor(value * 2) / 2, 0))
  .catch(0);

const amountSchema = z.number().finite().positive().catch(1);

/** null bilinçli olarak kapatılmış uyarıdır; bozuk değer varsayılana döner. */
const thresholdSchema = z
  .union([z.null(), z.number().finite().min(0)])
  .catch(DEFAULT_LOW_STOCK_THRESHOLD);

/** Geçersiz saatler atlanır, tekrarlar silinir, saatler sıralanır. */
const timesSchema = z
  .array(z.unknown())
  .transform((items) => [...new Set(items.filter((item) => matches(timeSchema, item)))].sort())
  .catch([]);

/** Bozuk veya boş sıklık "her gün" sayılır; hatırlatma sessizce kaybolmasın. */
const scheduleSchema = z
  .object({ kind: z.literal('weekdays'), days: z.array(z.unknown()) })
  .transform(({ days }): Schedule => {
    const valid = [...new Set(days.filter((day) => matches(weekdaySchema, day)))].sort();
    return valid.length > 0 && valid.length < 7
      ? { kind: 'weekdays', days: valid }
      : { kind: 'daily' };
  })
  .catch({ kind: 'daily' });

const durationSchema = z
  .object({ kind: z.literal('days'), count: z.number().int().positive() })
  .transform(({ count }): Duration => ({ kind: 'days', count }))
  .catch({ kind: 'continuous' });

const createdAtSchema = instantSchema.catch(UNKNOWN_CREATED_AT);

/** Kayıt anının yerel günü; kayıt anı bozuksa en eski gün. */
export function startDateOf(createdAt: unknown): string {
  const date = new Date(createdAtSchema.parse(createdAt));
  return formatDate(Number.isNaN(date.getTime()) ? new Date(0) : date);
}

const planFields = {
  times: timesSchema,
  schedule: scheduleSchema,
  duration: durationSchema,
  startDate: z.unknown().optional(),
};

/** Başlangıç günü okunamazsa ilacın kayıt günü kullanılır. */
function withStartDate<T extends { startDate?: unknown }>(plan: T, createdAt: unknown) {
  return {
    ...plan,
    startDate:
      typeof plan.startDate === 'string' && parseDate(plan.startDate)
        ? plan.startDate
        : startDateOf(createdAt),
  };
}

/** Bitiş anı okunamayan eski plan kullanılamaz. Planlar bitiş sırasına dizilir. */
const pastPlanSchema = z.object({ ...planFields, until: instantSchema });

function parsePastPlans(value: unknown, createdAt: string): PastPlan[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      const result = pastPlanSchema.safeParse(item);
      return result.success ? [withStartDate(result.data, createdAt) as PastPlan] : [];
    })
    .sort((a, b) => Date.parse(a.until) - Date.parse(b.until));
}

const medicationRecordSchema = z.looseObject({
  id: nonEmptyTextSchema,
  name: nonEmptyTextSchema,
  dose: z.string().catch(''),
  photoFile: z.string().catch(''),
  ...planFields,
  stock: stockSchema,
  createdAt: createdAtSchema,
  form: z
    .unknown()
    .optional()
    .transform((value) => getMedicationForm(value).kind),
  amount: amountSchema,
  unit: z.string().catch('adet'),
  location: z.string().catch(''),
  mealTiming: mealTimingSchema.catch('any'),
  lowStockThreshold: thresholdSchema,
  markedLow: z
    .unknown()
    .optional()
    .transform((value) => value === true),
  pastPlans: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
  photoPath: z.string().catch(''),
});

const doseLogRecordSchema = z.looseObject({
  id: nonEmptyTextSchema,
  medicationId: nonEmptyTextSchema,
  date: nonEmptyTextSchema,
  time: nonEmptyTextSchema,
  takenAt: z.string().catch(''),
});

/** Kullanılamayan kayıt kayda yazılır; kullanıcı uyarısını depo verir. */
function parseOrNull<T>(schema: z.ZodType<T>, value: unknown, kind: string): T | null {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  logger.warn(`Kullanılamayan ${kind} kaydı atlandı: ${describeIssues(result.error)}`);
  return null;
}

/**
 * Telefondan okunan tek bir ilaç kaydını denetler. Kimliği veya adı olmayan kayıt
 * kullanılamaz (`null`); diğer eksik alanlar varsayılan değerle doldurulur.
 */
export function parseMedicationRecord(value: unknown): Medication | null {
  const record = parseOrNull(medicationRecordSchema, value, 'ilaç');
  if (!record) return null;
  const plan: DosePlan = withStartDate(record, record.createdAt) as DosePlan;
  return {
    ...record,
    ...plan,
    pastPlans: parsePastPlans(record.pastPlans, record.createdAt),
    // Son değişiklik anı okunamazsa kayıt anı kullanılır; eşitlemede en eski sürüm sayılır.
    updatedAt: matches(instantSchema, record.updatedAt)
      ? (record.updatedAt as string)
      : record.createdAt,
  } as Medication;
}

/** Telefondan okunan tek bir doz kaydını denetler; eksik alanlı kayıt kullanılamaz. */
export function parseDoseLogRecord(value: unknown): DoseLog | null {
  return parseOrNull(doseLogRecordSchema, value, 'doz');
}
