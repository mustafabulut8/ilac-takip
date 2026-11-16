import { ValidationError } from '@/errors';
import { isMedicationFormKind, type NewMedication } from '@/models';
import { isValidTime } from '@/utils/time';

/** İlaç ekleme formunun alanları; dizi sırası ekrandaki sıradır (ilk hataya kaydırmak için). */
export const MEDICATION_FIELDS = ['name', 'dose', 'photo', 'times', 'stock'] as const;
export type MedicationField = (typeof MEDICATION_FIELDS)[number];
export type MedicationFieldErrors = Partial<Record<MedicationField, string>>;

/** Ekrandaki ham girdi: stok henüz metin, fotoğraf seçilmemiş olabilir. */
export type MedicationDraft = {
  name: string;
  dose: string;
  photo: string | null;
  times: string[];
  stock: string;
};

export const EMPTY_MEDICATION_DRAFT: MedicationDraft = {
  name: '',
  dose: '',
  photo: null,
  times: [],
  stock: '',
};

/** Stok metni boş olmayan, sıfır veya pozitif bir tam sayı mı? ("30" → 30, "-1"/"2,5" → null) */
export function parseStock(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

function validateTimes(times: string[]): string | undefined {
  if (times.length === 0) return 'Lütfen saati seçip "Saatini Ekle" butonuna basın.';
  if (!times.every(isValidTime))
    return 'Saatlerden biri geçersiz. Lütfen kaldırıp yeniden ekleyin.';
  return undefined;
}

/** Her alan için Türkçe hata mesajı; hata yoksa boş nesne. */
export function validateMedicationDraft(draft: MedicationDraft): MedicationFieldErrors {
  const errors: MedicationFieldErrors = {};
  if (!draft.name.trim()) errors.name = 'Lütfen ilacın adını yazın.';
  if (!draft.dose.trim()) errors.dose = 'Lütfen dozu yazın. Örnek: 1 tablet';
  if (!draft.photo) errors.photo = 'Lütfen ilacın fotoğrafını ekleyin.';
  const timesError = validateTimes(draft.times);
  if (timesError) errors.times = timesError;
  if (parseStock(draft.stock) === null) errors.stock = 'Lütfen stok adedini sayı olarak yazın.';
  return errors;
}

/** Ekrandaki sıraya göre ilk hatalı alan. */
export function firstInvalidField(errors: MedicationFieldErrors): MedicationField | undefined {
  return MEDICATION_FIELDS.find((field) => errors[field]);
}

/** Geçerli taslağı kaydedilecek veriye çevirir; geçersizse ValidationError fırlatır. */
export function toNewMedication(draft: MedicationDraft): NewMedication {
  const errors = validateMedicationDraft(draft);
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return {
    name: draft.name.trim(),
    dose: draft.dose.trim(),
    times: [...draft.times].sort(),
    stock: parseStock(draft.stock)!,
    photoSourceUri: draft.photo!,
  };
}

/**
 * Servis katmanındaki ikinci kontrol: ekran dışından (ileride Supabase, test) gelen
 * veri de aynı kurallardan geçer. Stok negatif veya ondalıklı olamaz.
 */
export function assertValidNewMedication(input: NewMedication) {
  const errors: Partial<Record<MedicationField | 'form', string>> = {};
  if (!input.name?.trim()) errors.name = 'Lütfen ilacın adını yazın.';
  if (!input.dose?.trim()) errors.dose = 'Lütfen dozu yazın. Örnek: 1 tablet';
  if (!input.photoSourceUri) errors.photo = 'Lütfen ilacın fotoğrafını ekleyin.';
  const timesError = validateTimes(Array.isArray(input.times) ? input.times : []);
  if (timesError) errors.times = timesError;
  if (!Number.isSafeInteger(input.stock) || input.stock < 0) {
    errors.stock = 'Lütfen stok adedini sayı olarak yazın.';
  }
  if (input.form !== undefined && !isMedicationFormKind(input.form)) {
    errors.form = 'İlaç formu geçersiz.';
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}
