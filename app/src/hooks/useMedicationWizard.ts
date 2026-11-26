import { useRef, useState } from 'react';

import { userMessageOf } from '@/errors';
import {
  draftFromMedication,
  EMPTY_MEDICATION_DRAFT,
  getMedicationForm,
  type Medication,
  type MedicationDraft,
  type MedicationFormKind,
} from '@/models';
import { changesOf, toNewMedication } from '@/validation/medication-input';
import {
  firstInvalidStep,
  stepError,
  stepIndexOf,
  WIZARD_STEPS,
  type WizardStepId,
} from '@/validation/wizard-steps';

export type { WizardStepId };

import { useMedications } from './useMedications';

/**
 * İlaç ekleme ve düzenleme sihirbazının durumu. Yeni ilaç ilk adımdan, düzenleme
 * özet adımından başlar; özetten açılan adım bitince yine özete dönülür.
 */
export function useMedicationWizard(original?: Medication) {
  const { addMedication, updateMedication } = useMedications();
  const [initial] = useState<MedicationDraft>(() =>
    original ? draftFromMedication(original) : EMPTY_MEDICATION_DRAFT,
  );
  // Düzenleme sırasında doz onaylanırsa stok değişir; fark, açılıştaki kayda göre alınır.
  const [source] = useState(original);
  const [draft, setDraft] = useState(initial);
  const [index, setIndex] = useState(original ? stepIndexOf('summary') : 0);
  const [returnsToSummary, setReturnsToSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  // index her zaman adım sınırları içindedir; ilk adım yalnızca tip güvenliği için.
  const step = WIZARD_STEPS[index] ?? WIZARD_STEPS[0];

  const update = (changes: Partial<MedicationDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setError(null);
  };

  /** Form değişince doz birimi de değişir; miktar yeni formun varsayılanına döner. */
  const selectForm = (kind: MedicationFormKind) => {
    if (kind === draft.form) return;
    update({ form: kind, dose: getMedicationForm(kind).defaultDose(), keptDose: null });
  };

  const showStep = (next: number) => {
    setError(null);
    setIndex(next);
  };

  const next = () => {
    const message = stepError(step.id, draft);
    if (message) {
      setError(message);
      return;
    }
    const formChanged = step.id === 'form' && draft.form !== initial.form;
    if (returnsToSummary && !formChanged) {
      setReturnsToSummary(false);
      showStep(stepIndexOf('summary'));
      return;
    }
    showStep(Math.min(index + 1, WIZARD_STEPS.length - 1));
  };

  /** Önceki adıma döner; dönülecek adım yoksa false. */
  const back = (): boolean => {
    if (returnsToSummary) {
      const message = stepError(step.id, draft);
      if (message) {
        setError(message);
        return true;
      }
      setReturnsToSummary(false);
      showStep(stepIndexOf('summary'));
      return true;
    }
    if (original || index === 0) return false;
    showStep(index - 1);
    return true;
  };

  const editStep = (id: (typeof WIZARD_STEPS)[number]['id']) => {
    setReturnsToSummary(true);
    showStep(stepIndexOf(id));
  };

  /** Fotoğraf çekilince veya seçilince kendiliğinden sonraki adıma geçilir. */
  const choosePhoto = (uri: string) => {
    update({ photo: uri });
    next();
  };

  const skipPhoto = () => {
    update({ photo: null, photoFile: '' });
    next();
  };

  /** Kaydeder; başarılıysa true döner. Hızlı çift dokunuş iki kayıt oluşturmaz. */
  const save = async (): Promise<boolean> => {
    if (savingRef.current) return false;
    const invalid = firstInvalidStep(draft);
    if (invalid) {
      editStep(invalid);
      setError(stepError(invalid, draft) ?? null);
      return false;
    }
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    try {
      if (source) await updateMedication(source.id, changesOf(source, draft));
      else await addMedication(toNewMedication(draft));
      return true;
    } catch (saveError) {
      setError(userMessageOf(saveError, 'İlaç kaydedilemedi. Lütfen tekrar deneyin.'));
      return false;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return {
    draft,
    step,
    stepNumber: index + 1,
    stepCount: WIZARD_STEPS.length,
    error,
    setError,
    isSaving,
    isDirty: JSON.stringify(draft) !== JSON.stringify(initial),
    canContinue: stepError(step.id, draft) === undefined,
    /** Bütün adımlar tamam mı? (Özet adımında kaydet düğmesi için) */
    isComplete: firstInvalidStep(draft) === undefined,
    update,
    selectForm,
    next,
    back,
    editStep,
    choosePhoto,
    skipPhoto,
    save,
  };
}

export type MedicationWizard = ReturnType<typeof useMedicationWizard>;
