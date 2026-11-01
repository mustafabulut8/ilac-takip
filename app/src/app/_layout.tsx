import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors, FontSize } from '@/constants/theme';
import { MedicationsProvider, useMedications } from '@/context/medications';
import { formatDate } from '@/lib/doses';
import { notificationDate, type DoseNotificationData } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { isLoaded } = useMedications();
  // Uygulama kapalıyken gelen dokunuşu da verir.
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const { medicationId, time } = response.notification.request.content
      .data as Partial<DoseNotificationData>;
    if (!medicationId || !time) return;

    router.push({
      pathname: '/aldim/[id]',
      // Doz, açılış gününe değil bildirimin geldiği güne yazılır.
      params: { id: medicationId, time, date: formatDate(notificationDate(response.notification.date)) },
    });
    // Temizlenmezse aynı sayfa uygulama her açıldığında yeniden gelir.
    Notifications.clearLastNotificationResponseAsync();
  }, [isLoaded, response]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: Colors.text,
          headerTitleStyle: { fontSize: FontSize.body, fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'Bugünkü İlaçlarım' }} />
        <Stack.Screen name="ilac-ekle" options={{ title: 'İlaç Ekle' }} />
        <Stack.Screen name="aldim/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <MedicationsProvider>
      <AppStack />
    </MedicationsProvider>
  );
}
