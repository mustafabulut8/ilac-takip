import { useEffect, useState } from 'react';

import { accountSession } from '@/services';
import { logger } from '@/utils/logger';

/**
 * Oturumdaki hesabı telefonda etkinleştirir (yerel depo, hatırlatmalar, eşitleme; ADR-027).
 * `userId`: `undefined` oturum henüz bilinmiyor, `null` oturum yok. Hesap hazır olana kadar
 * `null` döner; ilaç listesi ancak o zaman yüklenir, böylece kimse başkasının verisini görmez.
 */
export function useActiveAccount(userId: string | null | undefined) {
  const [active, setActive] = useState<{ userId: string | null } | null>(null);

  useEffect(() => {
    if (userId === undefined) return;
    let current = true;
    accountSession
      .activate(userId)
      .catch((error) => logger.error('Hesaba geçilemedi:', error))
      .finally(() => current && setActive({ userId }));
    return () => {
      current = false;
    };
  }, [userId]);

  return active && active.userId === userId ? active : null;
}
