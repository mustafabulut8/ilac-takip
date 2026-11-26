import { useState } from 'react';

import { historyService, type HistoryDay } from '@/services';
import { addDays, formatDate, startOfWeek } from '@/utils/date';

import { useMedications } from './useMedications';
import { useNow } from './useNow';

export type { DaySummary, HistoryDay } from '@/services';

/** Hafta günlerinin dışında kalırsa gösterilecek boş gün (getWeek her zaman 7 gün verir). */
function emptyDay(day: Date): HistoryDay {
  return { day, date: formatDate(day), doses: [], summary: 'open' };
}

/** Geçmiş ekranının haftası ve seçili günü. Gelecek haftalara geçilmez. */
export function useHistoryWeek() {
  const { medications, doseLogs } = useMedications();
  const now = useNow();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const monday = addDays(startOfWeek(now), weekOffset * 7);
  const week = historyService.getWeek(monday, medications, doseLogs, now);
  const today = formatDate(now);
  // Seçim bu haftada değilse: bu hafta bugün, geçmiş haftalarda Pazar.
  const selectedDay =
    week.days.find((day) => day.date === selected) ??
    week.days.find((day) => day.date === today) ??
    emptyDay(addDays(monday, 6));

  return {
    week,
    today,
    sunday: addDays(monday, 6),
    monday,
    selectedDay,
    selectDay: setSelected,
    canGoBack: historyService.hasHistoryBefore(monday, medications),
    canGoForward: weekOffset < 0,
    previousWeek: () => setWeekOffset((offset) => offset - 1),
    nextWeek: () => setWeekOffset((offset) => Math.min(offset + 1, 0)),
  };
}
