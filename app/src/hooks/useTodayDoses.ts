import { doseService } from '@/services';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

/** Bugünkü dozlar, grupları ve ilerlemesi; durumlar saatle birlikte güncel tutulur. */
export function useTodayDoses() {
  const { medications, doseLogs } = useMedications();
  const now = useNow();
  const doses = doseService.getTodayDoses(medications, doseLogs, now);

  return {
    now,
    doses,
    groups: doseService.groupByPeriod(doses),
    progress: doseService.progressOf(doses),
    nextDose: doseService.nextPending(doses),
  };
}
