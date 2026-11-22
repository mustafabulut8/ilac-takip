import {
  validateMedicationDraft,
  type MedicationDraft,
  type MedicationField,
} from './medication-input';

/** Sihirbazın adımları ve her adımda denetlenen alanlar (kararlar.md, 4. karar). */
export const WIZARD_STEPS = [
  { id: 'photo', label: 'Fotoğraf', fields: [] },
  { id: 'name', label: 'İlaç adı', fields: ['name'] },
  { id: 'form', label: 'İlaç şekli', fields: ['form'] },
  { id: 'dose', label: 'Dozaj', fields: ['dose'] },
  { id: 'schedule', label: 'Sıklık ve süre', fields: ['schedule', 'duration'] },
  { id: 'times', label: 'Saatler', fields: ['times'] },
  { id: 'meal', label: 'Aç / tok', fields: ['mealTiming'] },
  { id: 'stock', label: 'Stok', fields: ['stock'] },
  { id: 'summary', label: 'Özet', fields: [] },
] as const satisfies readonly { id: string; label: string; fields: readonly MedicationField[] }[];

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

export function stepIndexOf(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((step) => step.id === id);
}

/** Bu adımda düzeltilmesi gereken ilk hata; adım tamamsa undefined. */
export function stepError(id: WizardStepId, draft: MedicationDraft): string | undefined {
  const errors = validateMedicationDraft(draft);
  const fields: readonly MedicationField[] = WIZARD_STEPS[stepIndexOf(id)].fields;
  return fields.map((field) => errors[field]).find(Boolean);
}

/** Hatalı ilk adım; kaydetmeden önce oraya dönmek için. */
export function firstInvalidStep(draft: MedicationDraft): WizardStepId | undefined {
  return WIZARD_STEPS.find(({ id }) => stepError(id, draft))?.id;
}
