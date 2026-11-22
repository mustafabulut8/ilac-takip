import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Ekran açıkken bekleyen doz "kaçırıldı" durumuna geçebilsin diye saat bu aralıkla yenilenir. */
const REFRESH_INTERVAL_MS = 30 * 1000;

/** Kendiliğinden ilerleyen saat; uygulama arka plandan dönünce hemen güncellenir. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return now;
}
