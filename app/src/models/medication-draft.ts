import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  getMedicationForm,
  type DoseInput,
  type MedicationFormKind,
} from './forms';
import type { Medication } from './medication';
import type { Duration, MealTiming, Schedule } from './schedule';

/** Belirli gün sayısı seçildiğinde izin verilen aralık. */
export const DURATION_DAYS = { min: 1, max: 90, step: 1 };
export const MAX_STOCK = 999;

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
