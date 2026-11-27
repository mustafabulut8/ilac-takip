import { Stack } from 'expo-router';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/auth';
import { ConsentProvider } from '@/context/consent';
import { MedicationsProvider } from '@/context/medications';
import { useAuth } from '@/hooks/useAuth';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useConsent } from '@/hooks/useConsent';
import { useDoseNotificationTaps } from '@/hooks/useDoseNotificationTaps';
import { useMedications } from '@/hooks/useMedications';
import { useReminderSync } from '@/hooks/useReminderSync';
import { HOME_ROUTES, withConsentStep } from '@/utils/routes';

SplashScreen.preventAutoHideAsync();

/** Rıza sağlayıcısı oturumdaki profile göre kurulur (eşitlemenin sahibi). */
function WithConsent({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  return <ConsentProvider profile={profile}>{children}</ConsentProvider>;
}

function AppStack() {
  const { isLoaded } = useMedications();
  const { isLoading: authLoading, homeRoute: accountHome } = useAuth();
  const { status: consent } = useConsent();
  // Rıza hiç sorulmadıysa ana ekrandan önce rıza ekranı açılır (ADR-021).
  const homeRoute = withConsentStep(accountHome, consent);
  const ready = isLoaded && !authLoading;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useDoseNotificationTaps(ready);
  useReminderSync();
  useCloudSync();

  const signedIn = ready && homeRoute !== HOME_ROUTES.guest && homeRoute !== HOME_ROUTES.noProfile;
  const isHome = (route: string) => ready && homeRoute === route;

  // Korumalı gruplar: koşulu sağlanmayan ekran açılmaz, kullanıcı kendi ana ekranına
  // yönlendirilir. Oturum açılınca, kapanınca veya rol değişince yönlendirme kendiliğinden olur.
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Protected guard={isHome(HOME_ROUTES.standart)} redirectTo={homeRoute}>
          <Stack.Screen name="(tabs)" />
          {/* Sihirbazda kaydırarak geri çıkış, girilen bilgileri sormadan kaybettirirdi. */}
          <Stack.Screen name="ilac-ekle" options={{ gestureEnabled: false }} />
          <Stack.Screen name="ilac-duzenle/[id]" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={isHome(HOME_ROUTES.sade)} redirectTo={homeRoute}>
          <Stack.Screen name="sade" />
        </Stack.Protected>
        <Stack.Protected guard={isHome(HOME_ROUTES.aile)} redirectTo={homeRoute}>
          <Stack.Screen name="aile" />
          <Stack.Screen name="yakin/[kisiId]" />
        </Stack.Protected>
        <Stack.Protected
          guard={signedIn && homeRoute !== HOME_ROUTES.onboarding}
          redirectTo={homeRoute}>
          <Stack.Screen name="aldim/[id]" />
          <Stack.Screen name="ayarlar" />
          <Stack.Screen name="kullanim-bicimi" />
          {/* İlk kez sorulurken geri kaydırma kapalı; Ayarlar'dan açılınca da aynı ekran. */}
          <Stack.Screen name="saglik-verisi-rizasi" options={{ gestureEnabled: false }} />
          <Stack.Screen name="ailemi-bagla" />
        </Stack.Protected>
        {/* Aile kaydının bildirim izni adımından doğrudan açılır; onboarding bitmeden de erişilir. */}
        <Stack.Protected guard={signedIn} redirectTo={homeRoute}>
          <Stack.Screen name="kodla-baglan" />
        </Stack.Protected>
        <Stack.Protected guard={isHome(HOME_ROUTES.onboarding)} redirectTo={homeRoute}>
          <Stack.Screen name="bildirim-izni" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={isHome(HOME_ROUTES.noProfile)} redirectTo={homeRoute}>
          <Stack.Screen name="profil-hatasi" />
        </Stack.Protected>
        <Stack.Protected guard={!ready || homeRoute === HOME_ROUTES.guest} redirectTo={homeRoute}>
          <Stack.Screen name="hos-geldiniz" />
          <Stack.Screen name="kayit" />
          <Stack.Screen name="giris" />
          <Stack.Screen name="sifremi-unuttum" />
        </Stack.Protected>
        {/* Kayıttan ve Ayarlar'dan açılır; oturumdan bağımsızdır. */}
        <Stack.Screen name="kvkk" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  // Yazı tipi gelmeden çizilen metinler kalınlığını sonradan almıyor; açılış ekranı bu sırada
  // açık kalır. Yazı tipi yüklenemezse uygulama sistem yazı tipiyle açılır.
  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MedicationsProvider>
          <WithConsent>
            <AppStack />
          </WithConsent>
        </MedicationsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
