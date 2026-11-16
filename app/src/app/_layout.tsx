import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Colors, FontSize } from '@/constants/theme';
import { MedicationsProvider } from '@/context/medications';
import { useDoseNotificationTaps } from '@/hooks/useDoseNotificationTaps';
import { useMedications } from '@/hooks/useMedications';

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { isLoaded } = useMedications();

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  useDoseNotificationTaps(isLoaded);

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
