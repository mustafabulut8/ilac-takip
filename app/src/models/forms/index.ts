import { Cream } from './cream';
import { Drops } from './drops';
import { MedicationForm, type MedicationFormKind } from './medication-form';
import { Syrup } from './syrup';
import { Tablet } from './tablet';

export { Cream, Drops, MedicationForm, Syrup, Tablet, type MedicationFormKind };
export { UncountableForm } from './medication-form';

/** Formlar durumsuz olduğu için her türden tek örnek yeterli. switch yerine tablo kullanılır. */
const FORMS: Record<MedicationFormKind, MedicationForm> = {
  tablet: new Tablet(),
  syrup: new Syrup(),
  drops: new Drops(),
  cream: new Cream(),
};

export const DEFAULT_FORM_KIND: MedicationFormKind = 'tablet';

export function isMedicationFormKind(value: unknown): value is MedicationFormKind {
  return typeof value === 'string' && Object.hasOwn(FORMS, value);
}

/** Bilinmeyen veya eksik form Tablet sayılır; eski kayıtlarda form alanı yoktur. */
export function getMedicationForm(kind: unknown): MedicationForm {
  return isMedicationFormKind(kind) ? FORMS[kind] : FORMS[DEFAULT_FORM_KIND];
}

export function allMedicationForms(): MedicationForm[] {
  return Object.values(FORMS);
}
