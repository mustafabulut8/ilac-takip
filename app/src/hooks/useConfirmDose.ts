import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';

import { useMedications } from './useMedications';

const CONFIRM_FAILED = 'Kaydedilemedi. Lütfen tekrar deneyin.';

/**
 * "Aldım" onayı: Sade ana ekran ve İlaç zamanı ekranı aynı kuralı kullanır. Hızlı çift
 * dokunuş stoğu iki kez düşürmez; başarıda telefon titrer, hatada Türkçe mesaj gösterilir.
 */
export function useConfirmDose() {
  const { confirmDose } = useMedications();
  const confirming = useRef(false);
  const [error, setError] = useState<string | null>(null);

  /** Dozu kaydeder; kaydedildiyse true döner. */
  const confirm = async (medicationId: string, date: string, time: string): Promise<boolean> => {
    if (confirming.current) return false;
    confirming.current = true;
    try {
      await confirmDose(medicationId, date, time);
      setError(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      setError(CONFIRM_FAILED);
      return false;
    } finally {
      confirming.current = false;
    }
  };

  return { confirm, error };
}
