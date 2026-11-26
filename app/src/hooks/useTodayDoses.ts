import { doseCalculator } from '@/services';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

/**
 * Bugün ekranının dozları, grupları ve ilerlemesi; durumlar saatle birlikte güncel
 * tutulur. Listede dünün hâlâ alınabilen dozu da vardır, ilerleme yalnızca bugünü sayar.
 */
export function useTodayDoses() {
  const { medications, doseLogs } = useMedications();
  const now = useNow();
  const doses = doseCalculator.getVisibleDoses(medications, doseLogs, now);
  const today = doseCalculator.getTodayDoses(medications, doseLogs, now);

  return {
    now,
    doses,
    groups: doseCalculator.groupByPeriod(doses),
    progress: doseCalculator.progressOf(today),
    nextDose: doseCalculator.nextPending(doses),
  };
}
