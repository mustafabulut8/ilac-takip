import { Stack } from 'expo-router';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Colors } from '@/constants/theme';
import { MedicationsProvider } from '@/context/medications';
import { useDoseNotificationTaps } from '@/hooks/useDoseNotificationTaps';
import { useMedications } from '@/hooks/useMedications';

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { isLoaded } = useMedications();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  // Yazı tipi yüklenemezse uygulama sistem yazı tipiyle açılır.
  const isReady = isLoaded && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  useDoseNotificationTaps(isLoaded);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}>
        {/* Sihirbazda kaydırarak geri çıkış, girilen bilgileri sormadan kaybettirirdi. */}
        <Stack.Screen name="ilac-ekle" options={{ gestureEnabled: false }} />
        <Stack.Screen name="ilac-duzenle/[id]" options={{ gestureEnabled: false }} />
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
