import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';

import { doseCalculator } from '@/services';
import { addDays, atTime } from '@/utils/date';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

/** Sade mod ana ekranı: gösterilecek tek doz, günün ilerlemesi, yarının ilk dozu ve onay. */
export function useSimpleHome() {
  const { isLoaded, medications, doseLogs, confirmDose } = useMedications();
  const now = useNow();
  const confirming = useRef(false);
  const [lastTaken, setLastTaken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = doseCalculator.getTodayDoses(medications, doseLogs, now);
  const progress = doseCalculator.progressOf(today);
  const focus = doseCalculator.focusDose(today, now);
  const lateMinutes = focus
    ? Math.floor((now.getTime() - atTime(now, focus.time).getTime()) / 60000)
    : 0;
  const tomorrow = doseCalculator
    .getDosesOn(addDays(now, 1), medications, doseLogs, now)
    .find((dose) => dose.status !== 'alindi');

  /** Gösterilen dozu onaylar. Hızlı çift dokunuş stoğu iki kez düşürmez. */
  const confirmFocus = async () => {
    if (!focus || confirming.current) return;
    confirming.current = true;
    try {
      await confirmDose(focus.medication.id, focus.date, focus.time);
      setLastTaken(focus.medication.name);
      setError(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError('Kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      confirming.current = false;
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
