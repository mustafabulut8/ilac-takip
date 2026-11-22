import { doseService } from '@/services';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

/** Tek bir dozun ilacı, onay durumu, sıradaki doz ve onaylama işlemi (İlaç zamanı ekranı). */
export function useDose(medicationId: string, date: string, time: string | undefined) {
  const { isLoaded, medications, doseLogs, confirmDose } = useMedications();
  const now = useNow();
  const medication = medications.find((item) => item.id === medicationId);
  const log = doseLogs.find(
    (item) => item.id === doseService.logIdOf(medicationId, date, time ?? ''),
  );
  const today = doseService.getTodayDoses(medications, doseLogs, now);

  const confirm = async () => {
    if (!medication || !time) return;
    await confirmDose(medication.id, date, time);
  };

  return {
    isLoaded,
    now,
    medication,
    isTaken: !!log,
    takenAt: log?.takenAt,
    nextDose: doseService.nextPending(today),
    confirm,
  };
}
