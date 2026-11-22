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
import { Colors, FontSize } from '@/constants/theme';
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
          // Renk verilmezse başlık iOS'ta saydam olur ve ekranın üstünü kapatır.
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.primary,
          headerTitleStyle: { fontSize: FontSize.body, fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'Bugünkü İlaçlarım' }} />
        {/* Sihirbazda kaydırarak geri çıkış, girilen bilgileri sormadan kaybettirirdi. */}
        <Stack.Screen name="ilac-ekle" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name="ilac-duzenle/[id]"
          options={{ headerShown: false, gestureEnabled: false }}
        />
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
