import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Dose } from '@/lib/doses';
import type { Medication } from '@/types';

const CHANNEL_ID = 'ilac-hatirlatma';
const TEST_DELAY_SECONDS = 60;

export type DoseNotificationData = {
  medicationId: string;
  time: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Android 13 izin penceresi kanal olmadan çıkmaz; kanal ayarları sonradan değiştirilemez. */
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'İlaç hatırlatmaları',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function hasNotificationPermission() {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

export async function requestNotificationPermission() {
  await ensureChannel();
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

function doseContent(medication: Medication, time: string): Notifications.NotificationContentInput {
  const data: DoseNotificationData = { medicationId: medication.id, time };
  return {
    title: `İlaç saati: ${medication.name}`,
    body: `${time} dozunuz: ${medication.dose}. Almak için dokunun.`,
    sound: true,
    data,
  };
}

function scheduleDailyDose(medication: Medication, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return Notifications.scheduleNotificationAsync({
    identifier: `${medication.id}-${time}`,
    content: doseContent(medication, time),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function scheduleMedication(medication: Medication) {
  await ensureChannel();
  await Promise.all(medication.times.map((time) => scheduleDailyDose(medication, time)));
}

export async function scheduleTestNotification({ medication, time }: Dose) {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: `test-${Date.now()}`,
    content: doseContent(medication, time),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_DELAY_SECONDS,
      channelId: CHANNEL_ID,
    },
  });
}
