import Constants from 'expo-constants';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ROLE_OPTIONS } from '@/components/role-option';
import { ScreenHeader } from '@/components/screen-header';
import { SettingsRow } from '@/components/settings-row';
import { TestNotificationButton } from '@/components/test-notification-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

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
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <AppText size="title" weight="bold" color={Colors.textOnColor}>
              {initialOf(profile?.name)}
            </AppText>
          </View>
          <View style={styles.profileTexts}>
            <AppText size="subtitle" weight="bold">
              {profile?.name ?? 'Hesap'}
            </AppText>
            {/* E-posta kısaltılmaz; uzunsa alt satıra geçer (2. tur farkları). */}
            <AppText color={Colors.textSecondary}>{session?.user.email ?? ''}</AppText>
          </View>
        </Card>

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
          <SettingsRow
            icon="info"
            label="Uygulama hakkında"
            value={`Sürüm ${Constants.expoConfig?.version ?? '1.0.0'}`}
          />
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

/** Adın ilk harfi (Türkçe büyük harfle); ad yoksa boş. */
function initialOf(name?: string) {
  return name?.trim().charAt(0).toLocaleUpperCase('tr-TR') ?? '';
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
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  profileTexts: {
    flex: 1,
    gap: 6,
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
