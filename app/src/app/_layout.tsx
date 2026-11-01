import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors, FontSize } from '@/constants/theme';
import { MedicationsProvider, useMedications } from '@/context/medications';

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { isLoaded } = useMedications();

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

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
