import { ValidationError } from '@/errors';
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  getMedicationForm,
  isMedicationFormKind,
  MEAL_TIMING_LABELS,
  type DoseInput,
  type Duration,
  type Schedule,
  type MealTiming,
  type Medication,
  type MedicationFormKind,
  type NewMedication,
} from '@/models';
import { isValidTime } from '@/utils/time';

import { isWeekday } from './stored-records';

/** Belirli gün sayısı seçildiğinde izin verilen aralık. */
export const DURATION_DAYS = { min: 1, max: 90, step: 1 };
export const MAX_STOCK = 999;

/** Denetlenen alanlar; sıra sihirbazdaki sıradır. */
export const MEDICATION_FIELDS = [
  'name',
  'form',
  'dose',
  'schedule',
  'duration',
  'times',
  'mealTiming',
  'stock',
] as const;
export type MedicationField = (typeof MEDICATION_FIELDS)[number];
export type MedicationFieldErrors = Partial<Record<MedicationField, string>>;

/** Sihirbazdaki ham girdi; bazı alanlar henüz seçilmemiş olabilir. */
export type MedicationDraft = {
  /** Yeni çekilen veya seçilen fotoğrafın geçici adresi. */
  photo: string | null;
  /** Düzenlemede ilacın mevcut fotoğraf dosyası. */
  photoFile: string;
  name: string;
  form: MedicationFormKind | null;
  dose: DoseInput;
  /** Eski sürümde serbest yazılmış doz; kullanıcı yeni doz seçene kadar korunur. */
  keptDose: string | null;
  schedule: Schedule;
  duration: Duration;
  times: string[];
  mealTiming: MealTiming | null;
  stock: number;
  lowStockThreshold: number | null;
  markedLow: boolean;
};

export const EMPTY_MEDICATION_DRAFT: MedicationDraft = {
  photo: null,
  photoFile: '',
  name: '',
  form: null,
  dose: { amount: 1, unit: '', location: '', text: '' },
  keptDose: null,
  schedule: { kind: 'daily' },
  duration: { kind: 'continuous' },
  times: [],
  mealTiming: null,
  stock: 30,
  lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
  markedLow: false,
};

/** Kayıtlı ilacı sihirbazda düzenlenebilir hale getirir. */
export function draftFromMedication(medication: Medication): MedicationDraft {
  const form = getMedicationForm(medication.form);
  const { amount, unit, location } = medication;
  const dose: DoseInput = { amount, unit, location, text: medication.dose };
  const isReadable = form.formatDose(dose) === medication.dose && !form.validateDose(dose);
  return {
    photo: null,
    photoFile: medication.photoFile,
    name: medication.name,
    form: form.kind,
    dose: isReadable ? dose : form.defaultDose(),
    keptDose: isReadable ? null : medication.dose || null,
    schedule: medication.schedule,
    duration: medication.duration,
    times: medication.times,
    mealTiming: medication.mealTiming,
    stock: medication.stock,
    lowStockThreshold: medication.lowStockThreshold,
    markedLow: medication.markedLow,
  };
}

/** Taslağın ekranda gösterilecek doz metni; form seçilmediyse boş. */
export function doseTextOf({ form, dose, keptDose }: MedicationDraft): string {
  return keptDose ?? (form ? getMedicationForm(form).formatDose(dose) : '');
}

function validateTimes(times: unknown): string | undefined {
  if (!Array.isArray(times) || times.length === 0) return 'Lütfen en az bir saat ekleyin.';
  if (!times.every(isValidTime)) {
    return 'Saatlerden biri geçersiz. Lütfen kaldırıp yeniden ekleyin.';
  }
  return undefined;
}

function validateSchedule(schedule: Schedule): string | undefined {
  if (schedule.kind === 'daily') return undefined;
  return schedule.days.length > 0 && schedule.days.every(isWeekday)
    ? undefined
    : 'Lütfen en az bir gün seçin.';
}

function validateDuration(duration: Duration): string | undefined {
  if (duration.kind === 'continuous') return undefined;
  const { count } = duration;
  return Number.isInteger(count) && count >= DURATION_DAYS.min && count <= DURATION_DAYS.max
    ? undefined
    : `Lütfen ${DURATION_DAYS.min} ile ${DURATION_DAYS.max} arasında bir gün sayısı seçin.`;
}

/** Stok sıfır veya pozitiftir; yarım tablet için 0,5 adımına izin verilir. */
function validateStock(stock: number): string | undefined {
  return Number.isInteger(stock * 2) && stock >= 0 && stock <= MAX_STOCK
    ? undefined
    : `Lütfen 0 ile ${MAX_STOCK} arasında bir adet girin.`;
}

function validateDose(draft: MedicationDraft): string | undefined {
  if (draft.keptDose !== null || draft.form === null) return undefined;
  return getMedicationForm(draft.form).validateDose(draft.dose);
}

/** Her alan için Türkçe hata mesajı; hata yoksa boş nesne. */
export function validateMedicationDraft(draft: MedicationDraft): MedicationFieldErrors {
  const found: Record<MedicationField, string | undefined> = {
    name: draft.name.trim() ? undefined : 'Lütfen ilacın adını yazın.',
    form: draft.form ? undefined : 'Lütfen ilacın şeklini seçin.',
    dose: validateDose(draft),
    schedule: validateSchedule(draft.schedule),
    duration: validateDuration(draft.duration),
    times: validateTimes(draft.times),
    mealTiming: draft.mealTiming ? undefined : 'Lütfen birini seçin.',
    stock: validateStock(draft.stock),
  };
  return Object.fromEntries(Object.entries(found).filter(([, message]) => message));
}

/** Yedi günün hepsi seçildiyse "her gün" ile aynıdır. */
function normalizeSchedule(schedule: Schedule): Schedule {
  if (schedule.kind === 'daily') return schedule;
  const days = [...new Set(schedule.days)].sort();
  return days.length === 7 ? { kind: 'daily' } : { kind: 'weekdays', days };
}

/** Geçerli taslağı kaydedilecek veriye çevirir; geçersizse ValidationError fırlatır. */
export function toNewMedication(draft: MedicationDraft): NewMedication {
  const errors = validateMedicationDraft(draft);
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  const form = getMedicationForm(draft.form);
  return {
    name: draft.name.trim(),
    form: draft.form!,
    dose: doseTextOf(draft),
    amount: form.hasAmount() ? draft.dose.amount : 1,
    unit: draft.dose.unit,
    location: draft.dose.location.trim(),
    times: [...new Set(draft.times)].sort(),
    schedule: normalizeSchedule(draft.schedule),
    duration: draft.duration,
    mealTiming: draft.mealTiming!,
    stock: draft.stock,
    lowStockThreshold: draft.lowStockThreshold,
    markedLow: draft.markedLow,
    photoSourceUri: draft.photo,
  };
}

/** Güncellenebilen alanlar. Fotoğraf: verilmezse korunur, `null` ise kaldırılır. */
export type MedicationChanges = Partial<NewMedication>;

/** Düzenlemede yalnızca gerçekten değişen alanlar gönderilir; arada düşen stok ezilmez. */
export function changesOf(original: Medication, draft: MedicationDraft): MedicationChanges {
  const { photoSourceUri, ...fields } = toNewMedication(draft);
  const changed = Object.entries(fields).filter(
    ([key, value]) =>
      JSON.stringify(value) !== JSON.stringify(original[key as keyof typeof fields]),
  );
  const changes: MedicationChanges = Object.fromEntries(changed);
  if (photoSourceUri) return { ...changes, photoSourceUri };
  return draft.photoFile === original.photoFile ? changes : { ...changes, photoSourceUri: null };
}

/**
 * Servis katmanındaki ikinci kontrol: ekran dışından (ileride Supabase, test) gelen
 * veri de aynı kurallardan geçer. Yalnızca verilen alanlar denetlenir.
 */
export function assertValidChanges(changes: MedicationChanges) {
  const errors: MedicationFieldErrors = {};
  const check = (field: MedicationField, message: string | undefined) => {
    if (message) errors[field] = message;
  };
  if ('name' in changes)
    check('name', changes.name?.trim() ? undefined : 'Lütfen ilacın adını yazın.');
  if ('dose' in changes) check('dose', changes.dose?.trim() ? undefined : 'Lütfen dozu yazın.');
  if ('amount' in changes && !(Number.isFinite(changes.amount) && changes.amount! > 0)) {
    errors.dose = 'Lütfen geçerli bir miktar seçin.';
  }
  if ('form' in changes && !isMedicationFormKind(changes.form)) {
    errors.form = 'İlaç formu geçersiz.';
  }
  if ('times' in changes) check('times', validateTimes(changes.times));
  if (changes.schedule) check('schedule', validateSchedule(changes.schedule));
  if (changes.duration) check('duration', validateDuration(changes.duration));
  if ('mealTiming' in changes && !Object.hasOwn(MEAL_TIMING_LABELS, changes.mealTiming ?? '')) {
    errors.mealTiming = 'Lütfen birini seçin.';
  }
  if ('stock' in changes) check('stock', validateStock(changes.stock ?? Number.NaN));
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}

/** Yeni kayıtta tüm alanlar zorunludur; yalnızca fotoğraf isteğe bağlıdır. */
export function assertValidNewMedication(input: NewMedication) {
  const required: (keyof NewMedication)[] = [
    'name',
    'form',
    'dose',
    'amount',
    'times',
    'mealTiming',
    'stock',
  ];
  const explicit = Object.fromEntries(required.map((key) => [key, input[key]]));
  assertValidChanges({ ...input, ...explicit } as MedicationChanges);
}
