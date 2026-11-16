import { doseService } from '@/services';

import { useMedications } from './useMedications';

/** Tek bir dozun ilacı, onay durumu ve onaylama işlemi (ALDIM ekranı için). */
export function useDose(medicationId: string, date: string, time: string | undefined) {
  const { isLoaded, medications, doseLogs, confirmDose } = useMedications();
  const medication = medications.find((item) => item.id === medicationId);
  const isTaken =
    !!medication && !!time && doseService.isTaken(doseLogs, medication.id, date, time);

  const confirm = async () => {
    if (!medication || !time) return;
    await confirmDose(medication.id, date, time);
  };

  return { isLoaded, medication, isTaken, confirm };
}
