import { useState } from 'react';

import { notificationService } from '@/services';

import { useTodayDoses } from './useTodayDoses';

/** "1 dakika sonra test bildirimi" düğmesi: ilk bekleyen doz için bildirim kurar. */
export function useTestNotification() {
  const { nextDose } = useTodayDoses();
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const sendTestNotification = async () => {
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
