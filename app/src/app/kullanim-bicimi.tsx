import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { FieldError } from '@/components/form/field-error';
import { PrimaryButton } from '@/components/primary-button';
import { RolePicker } from '@/components/role-picker';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import type { UserRole } from '@/models';

/**
 * Ayarlar > Kullanım biçimi: rolü değiştirir. Kaydedilince kök düzen yeni rolün
 * ana ekranını açar (örneğin Standart'tan Sade'ye geçince Sade ana ekran).
 */
export default function UsageModeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateRole } = useAuth();
  const { busy, error, submit } = useFormSubmit();
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'standart');

  const save = async () => {
    if (role === profile?.role) {
      router.back();
      return;
    }
    await submit(() => updateRole(role));
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Kullanım biçimi" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <AppText color={Colors.textSecondary}>
          İlaçlarınız bu telefonda kalır; yalnızca ana ekranın görünümü değişir.
        </AppText>
        <RolePicker value={role} onChange={setRole} />
        <FieldError message={error} />
        <PrimaryButton label={busy ? 'Kaydediliyor…' : 'Kaydet'} onPress={save} disabled={busy} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: Spacing.screen,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.two,
  },
});
