import { router } from 'expo-router';
import { useEffect } from 'react';

import { notificationService } from '@/services';

/**
 * Doz bildirimine dokununca ALDIM sayfasını açar; uygulama kapalıyken gelen dokunuş dahil.
 * Veri yüklenmeden dinlemeye başlanmaz: ilaç listesi boşken sayfa "İlaç bulunamadı" derdi.
 */
export function useDoseNotificationTaps(isLoaded: boolean) {
  useEffect(() => {
    if (!isLoaded) return;
    return notificationService.subscribeToDoseTaps((target) => {
      router.push({
        pathname: '/aldim/[id]',
        params: { id: target.medicationId, time: target.time, date: target.date },
      });
    });
  }, [isLoaded]);
}
