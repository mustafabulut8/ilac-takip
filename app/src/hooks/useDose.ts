import { doseCalculator } from '@/services';

import { useConfirmDose } from './useConfirmDose';
import { useMedications } from './useMedications';
import { useNow } from './useNow';

/** Tek bir dozun ilacı, onay durumu, sıradaki doz ve onaylama işlemi (İlaç zamanı ekranı). */
export function useDose(medicationId: string, date: string, time: string | undefined) {
  const { isLoaded, medications, doseLogs } = useMedications();
  const now = useNow();
  const confirmation = useConfirmDose();
  const medication = medications.find((item) => item.id === medicationId);
  const log = doseLogs.find(
    (item) => item.id === doseCalculator.logIdOf(medicationId, date, time ?? ''),
  );
  const today = doseCalculator.getTodayDoses(medications, doseLogs, now);

  /** Dozu kaydeder; kaydedildiyse true döner. */
  const confirm = async (): Promise<boolean> => {
    if (!medication || !time) return false;
    return confirmation.confirm(medication.id, date, time);
  };

  return {
    isLoaded,
    now,
    medication,
    isTaken: !!log,
    takenAt: log?.takenAt,
    nextDose: doseCalculator.nextPending(today),
    error: confirmation.error,
    confirm,
  };
}
