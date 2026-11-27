import { useEffect } from 'react';
import { AppState } from 'react-native';

import { networkStatus, syncService } from '@/services';

/**
 * Eşitlemeyi tetikler: uygulama öne gelince ve internet geri gelince. Açılışta ve
 * sunucudaki değişiklikte rıza sağlayıcısı çalıştırır. Rıza yoksa `run` hiçbir şey yapmaz.
 */
export function useCloudSync() {
  useEffect(() => {
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncService.run();
    });
    const stopListening = networkStatus.onReconnect(() => void syncService.run());
    return () => {
      appState.remove();
      stopListening();
    };
  }, []);
}
