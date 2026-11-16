import { useState } from 'react';

import type { Dose } from '@/models';
import { notificationService } from '@/services';

/** "1 Dakika Sonra Test Bildirimi" butonu: ilk bekleyen doz için bildirim kurar. */
export function useTestNotification(findNextPendingDose: () => Dose | undefined) {
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const sendTestNotification = async () => {
    const nextDose = findNextPendingDose();
    if (!nextDose) {
      setTestMessage('Bugün bekleyen doz yok. Test için şu andan sonraki bir saatle ilaç ekleyin.');
      return;
    }
    try {
      await notificationService.scheduleTest(nextDose);
      setTestMessage(`${nextDose.medication.name} için bildirim 1 dakika sonra gelecek.`);
    } catch {
      setTestMessage('Test bildirimi planlanamadı. Bildirim iznini kontrol edin.');
    }
  };

  return { testMessage, sendTestNotification };
}
