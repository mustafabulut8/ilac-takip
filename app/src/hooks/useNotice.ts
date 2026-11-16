import { useEffect } from 'react';

import { useMedications } from './useMedications';

const NOTICE_DURATION_MS = 5 * 1000;

/** Ana ekrandaki kısa bilgi mesajı; 5 saniye sonra kendiliğinden kaybolur. */
export function useNotice() {
  const { notice, clearNotice } = useMedications();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(clearNotice, NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
    // clearNotice her çizimde yenilenir; süre yalnızca mesaj değişince başlamalı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice]);

  return notice;
}
