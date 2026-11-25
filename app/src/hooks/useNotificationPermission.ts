import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { notificationService, type NotificationPermissionStatus } from '@/services';
import { logger } from '@/utils/logger';

/**
 * Bildirim izninin durumu ve izni isteme. İzin kendiliğinden sorulmaz: Bildirim İzni
 * ekranında veya uyarıdaki düğmeyle sorulur. Telefonun Ayarlar'ından dönünce yeniden bakılır.
 */
export function useNotificationPermission() {
  const [status, setStatus] = useState<NotificationPermissionStatus | null>(null);

  const refresh = useCallback(() => {
    notificationService
      .permissionStatus()
      .then(setStatus)
      .catch((error) => logger.warn('Bildirim izni okunamadı:', error));
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  /** Sorulabiliyorsa sistem penceresini açar; reddedildiyse telefonun Ayarlar'ını açar. */
  const request = useCallback(async () => {
    if (status === 'denied') {
      await Linking.openSettings();
      return false;
    }
    const granted = await notificationService.requestPermission();
    refresh();
    return granted;
  }, [status, refresh]);

  return {
    status,
    /** İzin yok (henüz sorulmamış veya reddedilmiş); ekranda uyarı gösterilir. */
    missing: status !== null && status !== 'granted',
    request,
  };
}
