import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { FieldError } from '@/components/form/field-error';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { SettingsButton } from '@/components/settings-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useCareLinks } from '@/hooks/useCareLinks';
import { useNow } from '@/hooks/useNow';
import type { UserRole } from '@/models';
import { greetingFor } from '@/utils/time';

const MODE_LABEL: Record<UserRole, string> = {
  sade: 'Sade mod',
  standart: 'Standart mod',
  aile: 'Aile',
};

/** Hiç bağlantı yokken: yakınını bağlamaya çağıran boş durum. */
function EmptyState() {
  return (
    <Card style={styles.empty}>
      <View style={styles.circle}>
        <Icon name="family" size={40} color={Colors.primary} />
      </View>
      <AppText size="subtitle" weight="bold" center>
        Henüz bağlı yakınınız yok
      </AppText>
      <AppText center color={Colors.textSecondary}>
        Yakınınızdan uygulamadaki 6 haneli davet kodunu isteyin.
      </AppText>
      <PrimaryButton
        label="Yakınımı bağla"
        icon="link"
        onPress={() => router.push('/kodla-baglan')}
      />
    </Card>
  );
}

/**
 * Aile ana ekranı. Bu adımda bağlı yakınların listesi; günün dozları, uyarılar ve
 * "İlaç ekle" kişi kartlarına 4. grupta (Aile Paneli) eklenir.
 */
export default function FamilyHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const now = useNow();
  const care = useCareLinks();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <AppText size="title" weight="bold" accessibilityRole="header" style={styles.title}>
          {greetingFor(now, profile?.name)}
        </AppText>
        <SettingsButton />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <FieldError message={care.error} />
        {care.links?.length === 0 && <EmptyState />}
        {care.links?.map((link) => (
          <Card key={link.id} style={styles.person}>
            <AppText size="subtitle" weight="bold">
              {link.name}
            </AppText>
            <AppText color={Colors.textSecondary}>
              {link.relationLabel} · {MODE_LABEL[link.role]}
            </AppText>
          </Card>
        ))}
        {!!care.links?.length && (
          <SecondaryButton
            label="Başka bir yakınımı bağla"
            icon="link"
            onPress={() => router.push('/kodla-baglan')}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.four,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.screen,
  },
  title: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.screen,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  person: {
    gap: Spacing.one,
  },
  circle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.selectedSoft,
  },
});
