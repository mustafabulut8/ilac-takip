import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { FieldError } from '@/components/form/field-error';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFormSubmit } from '@/hooks/useFormSubmit';

/** Oturum var ama profil (ad ve rol) alınamadı: yeniden dene veya çıkış yap. */
export default function ProfileErrorScreen() {
  const insets = useSafeAreaInsets();
  const { profileError, retryProfile, signOut } = useAuth();
  const { busy, error, submit } = useFormSubmit();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.five }]}>
      <AppText size="title" weight="bold" accessibilityRole="header">
        Hesap bilgileri alınamadı
      </AppText>
      <Banner
        tone="warning"
        icon="warning"
        title={profileError ?? 'Hesap bilgileriniz alınamadı.'}
        detail="İlaçlarınız bu telefonda duruyor; hatırlatmalar çalışmaya devam eder."
      />
      <FieldError message={error} />
      <PrimaryButton label="Yeniden dene" onPress={() => submit(retryProfile)} disabled={busy} />
      <SecondaryButton label="Çıkış yap" onPress={() => submit(signOut)} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.four,
    paddingHorizontal: Spacing.screen,
    backgroundColor: Colors.background,
  },
});
