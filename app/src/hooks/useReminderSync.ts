import { useEffect } from 'react';
import { AppState } from 'react-native';

import { medicationService } from '@/services';

import { useMedications } from './useMedications';

/**
 * Uygulama öne gelince hatırlatmalar yeniden eşitlenir: izin sonradan verilmiş olabilir,
 * süreli ilaçların sınıra sığmayan günleri de böyle tamamlanır. İlk açılışı `load` eşitler.
 */
export function useReminderSync() {
  const { isLoaded, medications } = useMedications();

  useEffect(() => {
    if (!isLoaded) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') medicationService.syncReminders(medications);
    });
    return () => subscription.remove();
  }, [isLoaded, medications]);
}
