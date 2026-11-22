import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { DoseDone } from '@/components/dose-done';
import { DosePrompt } from '@/components/dose-prompt';
import { NotFoundMessage } from '@/components/not-found-message';
import { useDose } from '@/hooks/useDose';
import { useSnooze } from '@/hooks/useSnooze';
import { formatDate } from '@/utils/date';

function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Tam ekran ilaç zamanı: onaydan önce DosePrompt, sonra DoseDone. */
export default function TakeDoseScreen() {
  const {
    id,
    time,
    date = formatDate(new Date()),
  } = useLocalSearchParams<{
    id: string;
    time: string;
    date?: string;
  }>();
  const dose = useDose(id, date, time);
  const { isSnoozed, error: snoozeError, snooze } = useSnooze();
  const isConfirming = useRef(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, medication, now } = dose;

  if (!isLoaded) return null;
  if (!medication || !time) return <NotFoundMessage />;

  const confirm = async () => {
    // Hızlı çift dokunuş stoğu iki kez düşürmesin.
    if (isConfirming.current) return;
    isConfirming.current = true;
    try {
      await dose.confirm();
      setJustConfirmed(true);
      setError(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError('Kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      isConfirming.current = false;
    }
  };

  if (dose.isTaken) {
    return (
      <DoseDone
        medication={medication}
        takenAt={dose.takenAt}
        justConfirmed={justConfirmed}
        nextDose={dose.nextDose}
        onHome={goHome}
      />
    );
  }
  return (
    <DosePrompt
      medication={medication}
      date={date}
      time={time}
      now={now}
      error={error ?? snoozeError}
      isSnoozed={isSnoozed}
      onConfirm={confirm}
      onSnooze={() => snooze(medication, date, time)}
      onClose={goHome}
    />
  );
}
