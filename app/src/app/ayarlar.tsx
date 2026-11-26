import Constants from 'expo-constants';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ProfileCard } from '@/components/profile-card';
import { ROLE_OPTIONS } from '@/components/role-option';
import { ScreenHeader } from '@/components/screen-header';
import { SettingsRow } from '@/components/settings-row';
import { TestNotificationButton } from '@/components/test-notification-button';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText size="small" weight="bold" color={Colors.textSecondary} accessibilityRole="header">
        {title}
      </AppText>
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

/** Ayarlar - Hesap (Stitch 19) ve Çıkış onayı (Stitch 20). */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, session, homeRoute, signOut } = useAuth();
  const permission = useNotificationPermission();
  const logout = useFormSubmit();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  // Çıkıştan sonra kök düzen kendiliğinden rol seçimine yönlendirir.
  const onLogout = () => logout.submit(signOut);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Ayarlar"
        onBack={() => (router.canGoBack() ? router.back() : router.replace(homeRoute))}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <ProfileCard name={profile?.name} email={session?.user.email} />

        <Group title="HESAP">
          <SettingsRow
            icon="mode"
            label="Kullanım biçimi"
            value={profile ? ROLE_OPTIONS[profile.role].label : undefined}
            onPress={() => router.push('/kullanim-bicimi')}
          />
          <SettingsRow icon="family" label="Ailemi bağla" soon />
        </Group>
        <Group title="UYGULAMA">
          <SettingsRow
            icon="bell"
            label="Bildirimler"
            value={permission.missing ? 'Kapalı' : 'Açık'}
            onPress={permission.request}
          />
          <SettingsRow icon="textSize" label="Yazı boyutu" value="Telefon ayarına uyar" />
        </Group>
        <Group title="GİZLİLİK">
          <SettingsRow
            icon="document"
            label="Aydınlatma metni"
            onPress={() => router.push('/kvkk')}
          />
        </Group>
        <Group title="HAKKINDA">
          <SettingsRow icon="info" label="Uygulama hakkında" value={`Sürüm ${APP_VERSION}`} />
        </Group>
        <Card style={styles.card}>
          <SettingsRow icon="logout" label="Çıkış yap" onPress={() => setConfirmingLogout(true)} />
          <SettingsRow icon="trash" label="Hesabımı sil" soon danger />
        </Card>

        {__DEV__ && <TestNotificationButton />}
      </ScrollView>

      <ConfirmDialog
        visible={confirmingLogout}
        icon="logout"
        title="Çıkış yapmak istiyor musunuz?"
        message="İlaçlarınız ve hatırlatmalarınız bu telefonda kalır. Yeniden giriş yaptığınızda kaldığınız yerden devam edersiniz."
        confirmLabel="Evet, çıkış yap"
        onConfirm={onLogout}
        onCancel={() => setConfirmingLogout(false)}
        busy={logout.busy}
        error={logout.error}
      />
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
  group: {
    gap: Spacing.two,
  },
  card: {
    gap: 0,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
