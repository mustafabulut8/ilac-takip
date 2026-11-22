import { useState } from 'react';

import { userMessageOf } from '@/errors';
import type { Medication } from '@/models';
import { notificationService } from '@/services';

/** "10 dakika sonra hatırlat": erteleme isteği ve sonucu. */
export function useSnooze() {
  const [isSnoozed, setIsSnoozed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snooze = async (medication: Medication, date: string, time: string) => {
    setError(null);
    try {
      await notificationService.snooze({ medication, date, time });
      setIsSnoozed(true);
    } catch (snoozeError) {
      setIsSnoozed(false);
      setError(userMessageOf(snoozeError, 'Hatırlatma ertelenemedi. Lütfen tekrar deneyin.'));
    }
  };

  return { isSnoozed, error, snooze };
}
