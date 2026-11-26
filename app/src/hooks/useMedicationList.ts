import { useState } from 'react';

import { userMessageOf } from '@/errors';
import { getMedicationForm, type Medication } from '@/models';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

/** İlaçlarım ekranı: liste, bitmek üzere olanların sayısı, işaretleme ve silme. */
export function useMedicationList() {
  const { medications, updateMedication, removeMedication } = useMedications();
  const now = useNow();
  const [error, setError] = useState<string | null>(null);
  const lowCount = medications.filter((item) =>
    getMedicationForm(item.form).isRunningLow(item),
  ).length;

  /** İşlem başarısızsa ekranın üstünde Türkçe hata gösterilir. */
  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(userMessageOf(actionError, 'İşlem yapılamadı. Lütfen tekrar deneyin.'));
    }
  };

  return {
    medications,
    lowCount,
    now,
    error,
    toggleMarkedLow: (medication: Medication) =>
      run(() => updateMedication(medication.id, { markedLow: !medication.markedLow })),
    remove: (medication: Medication) => run(() => removeMedication(medication.id)),
  };
}
