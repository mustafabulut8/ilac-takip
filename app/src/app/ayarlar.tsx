import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Pill } from '@/components/pill';
import { ScreenHeader } from '@/components/screen-header';
import { SettingsRow } from '@/components/settings-row';
import { TestNotificationButton } from '@/components/test-notification-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const permissionDenied = useNotificationPermission();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Ayarlar"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Icon name="person" size={36} color={Colors.textOnColor} />
          </View>
          <View style={styles.profileTexts}>
            <AppText size="subtitle" weight="bold">
              Profil
            </AppText>
            <AppText color={Colors.textSecondary}>Henüz giriş yapılmadı</AppText>
            <Pill label="Yakında" />
          </View>
        </Card>

        <Group title="AİLE">
          <SettingsRow icon="family" label="Ailemi bağla" soon />
        </Group>
        <Group title="UYGULAMA">
          <SettingsRow
            icon="bell"
            label="Bildirimler"
            value={permissionDenied ? 'Kapalı' : 'Açık'}
            onPress={() => Linking.openSettings()}
          />
          <SettingsRow icon="textSize" label="Yazı boyutu" value="Telefon ayarına uyar" />
        </Group>
        <Group title="GİZLİLİK">
          <SettingsRow icon="shield" label="Kişisel verilerim" soon />
          <SettingsRow icon="document" label="Aydınlatma metni" soon />
        </Group>
        <Group title="HAKKINDA">
          <SettingsRow
            icon="info"
            label="Uygulama hakkında"
            value={`Sürüm ${Constants.expoConfig?.version ?? '1.0.0'}`}
          />
        </Group>
        <Card style={styles.card}>
          <SettingsRow icon="logout" label="Çıkış yap" soon />
          <SettingsRow icon="trash" label="Hesabımı ve verilerimi sil" soon danger />
        </Card>

        {__DEV__ && <TestNotificationButton />}
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
