import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { FieldError } from '@/components/form/field-error';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import {
  HEALTH_CONSENT_FOOTER,
  HEALTH_CONSENT_ITEMS,
  HEALTH_CONSENT_TITLE,
} from '@/constants/health-consent';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useConsent } from '@/hooks/useConsent';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { useMedications } from '@/hooks/useMedications';

/**
 * Sağlık verisi açık rızası (KVKK, ADR-021). Bildirim izninden sonra bir kez, sonra
 * Ayarlar'dan açılır. Kabul edilince telefondaki ilaçlar ilk kez hesaba yüklenir;
 * "Şimdilik hayır" denirse uygulama yalnızca telefonda çalışır.
 */
export default function HealthConsentScreen() {
  const insets = useSafeAreaInsets();
  const { homeRoute } = useAuth();
  const { grant, decline } = useConsent();
  const { medications } = useMedications();
  const answer = useFormSubmit();

  const leave = () => (router.canGoBack() ? router.back() : router.replace(homeRoute));
  const onAccept = async () => {
    if (await answer.submit(grant)) leave();
  };
  const onDecline = async () => {
    if (await answer.submit(decline)) leave();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.four },
      ]}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Icon name="shield" size={72} color={Colors.primary} />
        </View>
        <AppText size="title" weight="bold" center accessibilityRole="header">
          {HEALTH_CONSENT_TITLE}
        </AppText>
      </View>

      <Card style={styles.card}>
        {HEALTH_CONSENT_ITEMS.map((item) => (
          <View key={item.label} style={styles.item}>
            <AppText weight="bold">{item.label}</AppText>
            <AppText>{item.text}</AppText>
          </View>
        ))}
      </Card>

      {medications.length > 0 && (
        <AppText weight="semibold">
          Telefonunuzdaki {medications.length} ilaç ve doz geçmişi hesabınıza yüklenecek.
        </AppText>
      )}
      <AppText color={Colors.textSecondary}>{HEALTH_CONSENT_FOOTER}</AppText>

      <View style={styles.actions}>
        <FieldError message={answer.error} />
        <PrimaryButton label="Kabul ediyorum" onPress={onAccept} disabled={answer.busy} />
        <SecondaryButton label="Şimdilik hayır" onPress={onDecline} disabled={answer.busy} />
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
  badge: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.selectedSoft,
  },
  card: {
    gap: Spacing.four,
  },
  item: {
    gap: Spacing.one,
  },
  actions: {
    marginTop: 'auto',
    gap: Spacing.three,
  },
});
