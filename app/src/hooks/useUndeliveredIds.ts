import { useEffect, useState } from 'react';

import { familyDashboard } from '@/services';
import { logger } from '@/utils/logger';

/**
 * Aile ekledi veya düzenledi ama yakının telefonu henüz almadı (`delivered_at` boş).
 * `medications` her değiştiğinde (kayıt, Realtime) yeniden okunur.
 */
export function useUndeliveredIds(patientId: string, medications: unknown[]) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    familyDashboard
      .summaryOf(patientId)
      .then((summary) => active && setIds(summary.undeliveredIds))
      .catch((error) => logger.warn('Teslim bilgisi alınamadı:', error));
    return () => {
      active = false;
    };
  }, [patientId, medications]);

  return ids;
}
