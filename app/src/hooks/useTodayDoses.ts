import { doseCalculator } from '@/services';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

/** Bugünkü dozlar, grupları ve ilerlemesi; durumlar saatle birlikte güncel tutulur. */
export function useTodayDoses() {
  const { medications, doseLogs } = useMedications();
  const now = useNow();
  const doses = doseCalculator.getTodayDoses(medications, doseLogs, now);

  return {
    now,
    doses,
    groups: doseCalculator.groupByPeriod(doses),
    progress: doseCalculator.progressOf(doses),
    nextDose: doseCalculator.nextPending(doses),
  };
}
