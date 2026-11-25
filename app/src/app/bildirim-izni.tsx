import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { TextLink } from '@/components/text-link';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

const BENEFITS = [
  'İlaç saatinde hatırlatma',
  'Hangi ilacı, kaç tane alacağınız',
  'İnternet olmasa da çalışır',
];

/**
 * Bildirim izni (Stitch 12). Kayıttan hemen sonra bir kez gösterilir; iki düğme de
 * kullanıcıyı ana ekranına götürür. İzin sonradan ana ekrandaki uyarıdan da verilebilir.
 */
export default function NotificationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const { finishOnboarding } = useAuth();
  const { request } = useNotificationPermission();

  const allow = async () => {
    try {
      await request();
    } finally {
      finishOnboarding();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.four },
      ]}>
      <View style={styles.hero}>
        <View style={styles.bell}>
          <Icon name="bell" size={88} color={Colors.primary} />
        </View>
        <AppText size="title" weight="bold" center accessibilityRole="header">
          İlaç saatlerinizi kaçırmayın
        </AppText>
        <AppText center color={Colors.textSecondary}>
          İlaç saatiniz geldiğinde telefonunuz size bildirim gönderir. Bunun için bildirimlere izin
          vermeniz gerekir.
        </AppText>
      </View>

      <Card>
        {BENEFITS.map((text) => (
          <View key={text} style={styles.benefit}>
            <View style={styles.check}>
              <Icon name="check" size={20} color={Colors.primary} />
            </View>
            <AppText weight="semibold" style={styles.benefitText}>
              {text}
            </AppText>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <PrimaryButton label="Bildirimlere izin ver" icon="bell" onPress={allow} />
        <TextLink label="Şimdi değil" onPress={finishOnboarding} />
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
    flexGrow: 1,
    gap: Spacing.four,
    paddingHorizontal: Spacing.screen,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  bell: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.selectedSoft,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  check: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.selectedSoft,
  },
  benefitText: {
    flex: 1,
  },
  actions: {
    marginTop: 'auto',
    gap: Spacing.two,
  },
});
