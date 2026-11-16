import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { notificationService } from '@/services';

/** Bildirim izni kapalı mı? Açılışta izin istenir, Ayarlar'dan dönünce yeniden bakılır. */
export function useNotificationPermission() {
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    notificationService.requestPermission().then((granted) => setPermissionDenied(!granted));

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      notificationService.hasPermission().then((granted) => setPermissionDenied(!granted));
    });
    return () => subscription.remove();
  }, []);

  return permissionDenied;
}
