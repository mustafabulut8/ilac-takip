import { useState } from 'react';

import { doseService } from '@/services';
import { addDays, formatDate, startOfWeek } from '@/utils/date';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

export type { DaySummary, HistoryDay } from '@/services';

/** Geçmiş ekranının haftası ve seçili günü. Gelecek haftalara geçilmez. */
export function useHistoryWeek() {
  const { medications, doseLogs } = useMedications();
  const now = useNow();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const monday = addDays(startOfWeek(now), weekOffset * 7);
  const week = doseService.getWeek(monday, medications, doseLogs, now);
  const today = formatDate(now);
  // Seçim bu haftada değilse: bu hafta bugün, geçmiş haftalarda Pazar.
  const selectedDay =
    week.days.find((day) => day.date === selected) ??
    week.days.find((day) => day.date === today) ??
    week.days[6];

  return {
    week,
    today,
    sunday: addDays(monday, 6),
    monday,
    selectedDay,
    selectDay: setSelected,
    canGoBack: doseService.hasHistoryBefore(monday, medications),
    canGoForward: weekOffset < 0,
    previousWeek: () => setWeekOffset((offset) => offset - 1),
    nextWeek: () => setWeekOffset((offset) => Math.min(offset + 1, 0)),
  };
}
