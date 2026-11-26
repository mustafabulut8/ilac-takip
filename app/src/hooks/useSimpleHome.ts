import { useState } from 'react';

import { doseCalculator } from '@/services';
import { addDays, atTime, parseDate } from '@/utils/date';

import { useConfirmDose } from './useConfirmDose';
import { useMedications } from './useMedications';
import { useNow } from './useNow';

/** Sade mod ana ekranı: gösterilecek tek doz, günün ilerlemesi, yarının ilk dozu ve onay. */
export function useSimpleHome() {
  const { isLoaded, medications, doseLogs } = useMedications();
  const now = useNow();
  const { confirm, error } = useConfirmDose();
  const [lastTaken, setLastTaken] = useState<string | null>(null);

  const today = doseCalculator.getTodayDoses(medications, doseLogs, now);
  const progress = doseCalculator.progressOf(today);
  // Dünün hâlâ alınabilen dozu (ör. 23:50 dozu 00:10'da) da gösterilebilir.
  const focus = doseCalculator.focusDose(
    doseCalculator.getVisibleDoses(medications, doseLogs, now),
    now,
  );
  const lateMinutes = focus
    ? Math.floor(
        (now.getTime() - atTime(parseDate(focus.date) ?? now, focus.time).getTime()) / 60000,
      )
    : 0;
  const tomorrow = doseCalculator
    .getDosesOn(addDays(now, 1), medications, doseLogs, now)
    .find((dose) => dose.status !== 'alindi');

  /** Gösterilen dozu onaylar. Hızlı çift dokunuş stoğu iki kez düşürmez. */
  const confirmFocus = async () => {
    if (!focus) return;
    if (await confirm(focus.medication.id, focus.date, focus.time)) {
      setLastTaken(focus.medication.name);
    }
  };

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
    /** Son onaylanan ilacın adı; onay mesajında gösterilir. */
    lastTaken,
    error,
    confirmFocus,
  };
}
