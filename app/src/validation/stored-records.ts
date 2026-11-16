import { getMedicationForm, type DoseLog, type Medication } from '@/models';
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

/** Stok negatif, ondalıklı veya sayı değilse güvenli bir tam sayıya çevrilir. */
export function sanitizeStock(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
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
    times: sanitizeTimes(value.times),
    stock: sanitizeStock(value.stock),
    createdAt: isNonEmptyString(value.createdAt) ? value.createdAt : UNKNOWN_CREATED_AT,
    form: getMedicationForm(value.form).kind,
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
