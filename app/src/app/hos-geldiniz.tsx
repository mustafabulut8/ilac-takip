import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { PrimaryButton } from '@/components/primary-button';
import { RolePicker } from '@/components/role-picker';
import { TextLink } from '@/components/text-link';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { UserRole } from '@/models';

/** Hoş geldiniz ve rol seçimi (Stitch 09). Oturum yokken açılan ilk ekran. */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<UserRole>('sade');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four },
      ]}>
      <View style={styles.brand}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          accessibilityIgnoresInvertColors
          accessible={false}
        />
        <AppText size="heading" weight="bold" accessibilityRole="header">
          İlaç Takip
        </AppText>
        <AppText center color={Colors.textSecondary}>
          İlaçlarınızı zamanında almanıza yardımcı olur.
        </AppText>
      </View>

      <RolePicker value={role} onChange={setRole} />

      <View style={styles.actions}>
        <PrimaryButton
          label="Devam"
          icon="arrowRight"
          onPress={() => router.push({ pathname: '/kayit', params: { rol: role } })}
        />
        <TextLink
          prefix="Zaten hesabım var"
          label="Giriş yap"
          onPress={() => router.push('/giris')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.screen,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: Radius.button,
  },
  actions: {
    gap: Spacing.two,
  },
});
