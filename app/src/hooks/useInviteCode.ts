import { useEffect, useState } from 'react';

import { userMessageOf } from '@/errors';
import type { InviteCode } from '@/models';
import { careService } from '@/services';
import { logger } from '@/utils/logger';

/**
 * Ailemi Bağla ekranının kodu. Ekran açılınca yeni kod üretilir (öncekini geçersiz
 * kılar); "Yeni kod al" da aynısını yapar. Rıza yoksa kod üretilmez.
 */
export function useInviteCode(enabled: boolean) {
  const [invite, setInvite] = useState<InviteCode | null>(null);
  const [busy, setBusy] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  // Her artış yeni kod ister; durum yalnızca sonuç gelince değişir.
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    careService
      .createInviteCode()
      .then((next) => active && setInvite(next))
      .catch((caught) => {
        logger.warn('Davet kodu üretilemedi:', caught);
        if (active) setError(userMessageOf(caught, 'Kod alınamadı. Lütfen tekrar deneyin.'));
      })
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [enabled, request]);

  const renew = () => {
    setBusy(true);
    setError(null);
    setRequest((current) => current + 1);
  };

  return { code: invite?.code ?? null, expiresAt: invite?.expiresAt ?? null, busy, error, renew };
}
