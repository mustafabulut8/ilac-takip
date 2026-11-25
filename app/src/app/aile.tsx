import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { SettingsButton } from '@/components/settings-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useNow } from '@/hooks/useNow';
import { greetingFor } from '@/utils/time';

/** Aile rolünün geçici ana ekranı; Aile paneli 2. parçada gelecek. */
export default function FamilyPlaceholderScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const now = useNow();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <AppText size="title" weight="bold" accessibilityRole="header" style={styles.title}>
          {greetingFor(now, profile?.name)}
        </AppText>
        <SettingsButton />
      </View>
      <Card style={styles.card}>
        <View style={styles.circle}>
          <Icon name="family" size={40} color={Colors.primary} />
        </View>
        <AppText size="subtitle" weight="bold" center>
          Aile paneli 2. parçada gelecek
        </AppText>
        <AppText center color={Colors.textSecondary}>
          Yakınınızı davet koduyla bağlayıp ilaçlarını buradan takip edebileceksiniz.
        </AppText>
      </Card>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  card: {
    alignItems: 'center',
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
