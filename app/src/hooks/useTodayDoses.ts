import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { doseService } from '@/services';

import { useMedications } from './useMedications';

/** Ekran açıkken bekleyen doz "kaçırıldı" durumuna geçebilsin diye saat bu aralıkla yenilenir. */
const REFRESH_INTERVAL_MS = 30 * 1000;

/** Bugünkü dozlar, durumları saatle birlikte güncel tutulur. */
export function useTodayDoses() {
  const { medications, doseLogs } = useMedications();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    // Uygulama arka plandan dönünce (örn. Ayarlar'dan) saat hemen güncellensin.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  const doses = doseService.getTodayDoses(medications, doseLogs, now);

  /** Test bildirimi için şu anki saate göre ilk bekleyen doz. */
  const findNextPendingDose = () =>
    doseService
      .getTodayDoses(medications, doseLogs, new Date())
      .find((dose) => dose.status === 'bekliyor');

  return { doses, findNextPendingDose };
}
