import { useState } from 'react';

import type { NewMedication } from '@/models';
import {
  EMPTY_MEDICATION_DRAFT,
  firstInvalidField,
  toNewMedication,
  validateMedicationDraft,
  type MedicationDraft,
  type MedicationField,
  type MedicationFieldErrors,
} from '@/validation/medication-input';

type TextDraftField = 'name' | 'dose' | 'stock';

export type DraftCheck =
  { ok: true; value: NewMedication } | { ok: false; firstInvalid: MedicationField };

/** İlaç ekleme formunun girdileri ve alan hataları. Doğrulama kuralları validation/ altındadır. */
export function useMedicationDraft() {
  const [draft, setDraft] = useState<MedicationDraft>(EMPTY_MEDICATION_DRAFT);
  const [errors, setErrors] = useState<MedicationFieldErrors>({});

  const clearError = (field: MedicationField) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  const setError = (field: MedicationField, message: string) =>
    setErrors((current) => ({ ...current, [field]: message }));

  const setText = (field: TextDraftField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    clearError(field);
  };

  const setPhoto = (uri: string) => {
    setDraft((current) => ({ ...current, photo: uri }));
    clearError('photo');
  };

  /** Aynı saat iki kez eklenmez; liste sıralı tutulur. */
  const addTime = (time: string) => {
    setDraft((current) =>
      current.times.includes(time)
        ? current
        : { ...current, times: [...current.times, time].sort() },
    );
    clearError('times');
  };

  const removeTime = (time: string) =>
    setDraft((current) => ({ ...current, times: current.times.filter((item) => item !== time) }));

  /** Tüm alanları denetler, hataları ekrana yazar ve sonucu döner. */
  const check = (): DraftCheck => {
    const found = validateMedicationDraft(draft);
    setErrors(found);
    const firstInvalid = firstInvalidField(found);
    if (firstInvalid) return { ok: false, firstInvalid };
    return { ok: true, value: toNewMedication(draft) };
  };

  return { draft, errors, setText, setPhoto, setError, addTime, removeTime, check };
}
