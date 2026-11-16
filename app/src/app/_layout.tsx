import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Colors, FontSize } from '@/constants/theme';
import { MedicationsProvider } from '@/context/medications';
import { useMedications } from '@/hooks/useMedications';
import { notificationService } from '@/services';

SplashScreen.preventAutoHideAsync();
// Uygulama açıkken gelen bildirim de gösterilsin.
notificationService.configure();

function AppStack() {
  const { isLoaded } = useMedications();
  // Uygulama kapalıyken gelen dokunuşu da verir.
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !response) return;
    const target = notificationService.doseTargetFromResponse(response);
    if (!target) return;

    router.push({
      pathname: '/aldim/[id]',
      params: { id: target.medicationId, time: target.time, date: target.date },
    });
    // Temizlenmezse aynı sayfa uygulama her açıldığında yeniden gelir.
    Notifications.clearLastNotificationResponseAsync();
  }, [isLoaded, response]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          // Renk verilmezse başlık iOS'ta saydam olur ve ekranın üstünü kapatır.
          headerStyle: { backgroundColor: Colors.background },
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
    <ErrorBoundary>
      <MedicationsProvider>
        <AppStack />
      </MedicationsProvider>
    </ErrorBoundary>
  );
}
