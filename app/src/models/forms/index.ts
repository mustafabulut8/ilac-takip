import { Capsule } from './capsule';
import { Cream } from './cream';
import { Drops } from './drops';
import { Injection } from './injection';
import { MedicationForm, type MedicationFormKind } from './medication-form';
import { Other } from './other';
import { Patch } from './patch';
import { Sachet } from './sachet';
import { Spray } from './spray';
import { Syrup } from './syrup';
import { Tablet } from './tablet';

export {
  Capsule,
  Cream,
  Drops,
  Injection,
  MedicationForm,
  Other,
  Patch,
  Sachet,
  Spray,
  Syrup,
  Tablet,
  type MedicationFormKind,
};
export {
  formatAmount,
  formatNumber,
  DEFAULT_LOW_STOCK_THRESHOLD,
  UncountableForm,
  type DoseInput,
} from './medication-form';

/** Formlar durumsuz olduğu için her türden tek örnek yeterli. Sıra, sihirbazdaki sıradır. */
const FORMS: Record<MedicationFormKind, MedicationForm> = {
  tablet: new Tablet(),
  capsule: new Capsule(),
  syrup: new Syrup(),
  drops: new Drops(),
  cream: new Cream(),
  spray: new Spray(),
  injection: new Injection(),
  sachet: new Sachet(),
  patch: new Patch(),
  other: new Other(),
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
