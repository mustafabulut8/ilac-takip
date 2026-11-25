import { doseService } from '@/services';
import { addDays, atTime } from '@/utils/date';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

/** Sade mod ana ekranı: gösterilecek tek doz, günün ilerlemesi ve yarının ilk dozu. */
export function useSimpleHome() {
  const { isLoaded, medications, doseLogs, confirmDose } = useMedications();
  const now = useNow();
  const today = doseService.getTodayDoses(medications, doseLogs, now);
  const progress = doseService.progressOf(today);
  const focus = doseService.focusDose(today, now);
  const lateMinutes = focus
    ? Math.floor((now.getTime() - atTime(now, focus.time).getTime()) / 60000)
    : 0;
  const tomorrow = doseService
    .getDosesOn(addDays(now, 1), medications, doseLogs, now)
    .find((dose) => dose.status !== 'alindi');

  return {
    isLoaded,
    now,
    hasMedications: medications.length > 0,
    focus,
    /** Gösterilen dozun saatinden bu yana geçen dakika; saati gelmediyse 0 veya eksi. */
    lateMinutes,
    progress,
    /** Bugün planlanan dozların hepsi alındı mı? */
    allTaken: progress.total > 0 && progress.taken === progress.total,
    tomorrowFirstTime: tomorrow?.time ?? null,
    confirm: (medicationId: string, date: string, time: string) =>
      confirmDose(medicationId, date, time),
  };
}
