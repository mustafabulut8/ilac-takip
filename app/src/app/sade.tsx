import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { ButtonBase } from '@/components/button-base';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { SecondaryButton } from '@/components/secondary-button';
import { SettingsButton } from '@/components/settings-button';
import { SimpleDoseCard } from '@/components/simple/simple-dose-card';
import { SimpleProgress } from '@/components/simple/simple-progress';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useMedications } from '@/hooks/useMedications';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useSimpleHome } from '@/hooks/useSimpleHome';
import { getMedicationForm } from '@/models';
import { formatLongDate } from '@/utils/date';
import { greetingFor } from '@/utils/time';

/**
 * Sade mod ana ekranı (Stitch 13, 14, 15): tek ilaç, tek büyük onay düğmesi.
 * İlaç ekleme düğmesi yoktur; ilaçları aile ekler (15. karar). En küçük yazı 20pt.
 */
export default function SimpleHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { storageWarnings } = useMedications();
  const permission = useNotificationPermission();
  const home = useSimpleHome();
  const { now, focus, progress } = home;
  const confirming = useRef(false);
  const [lastTaken, setLastTaken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!home.isLoaded) return null;

  const confirm = async () => {
    // Hızlı çift dokunuş stoğu iki kez düşürmesin.
    if (!focus || confirming.current) return;
    confirming.current = true;
    try {
      await home.confirm(focus.medication.id, focus.date, focus.time);
      setLastTaken(focus.medication.name);
      setError(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError('Kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      confirming.current = false;
    }
  };

  const form = focus ? getMedicationForm(focus.medication.form) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.five },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          <AppText size="display" weight="bold" accessibilityRole="header">
            {greetingFor(now, profile?.name)}
          </AppText>
          <AppText size="large" color={Colors.textSecondary}>
            {formatLongDate(now)}
          </AppText>
        </View>
        <SettingsButton />
      </View>

      {storageWarnings.map((warning) => (
        <Banner key={warning} tone="danger" icon="warning" title={warning} />
      ))}
      {permission.missing && (
        <Banner
          tone="danger"
          icon="bell"
          title="Bildirim izni kapalı"
          detail="İzin vermezseniz ilaç saatinde hatırlatma alamazsınız.">
          <SecondaryButton
            label={permission.status === 'denied' ? 'Ayarları aç' : 'İzin ver'}
            variant="danger"
            onPress={permission.request}
          />
        </Banner>
      )}
      {lastTaken && (
        <Banner tone="success" icon="check" title={`${lastTaken} alındı olarak kaydedildi.`} />
      )}

      {focus && form ? (
        <>
          <SimpleDoseCard dose={focus} lateMinutes={home.lateMinutes} />
          {error && (
            <AppText size="large" weight="bold" color={Colors.danger}>
              {error}
            </AppText>
          )}
          <ButtonBase
            label={form.confirmLabel()}
            accessibilityLabel={form.confirmAccessibilityLabel(focus.medication.name)}
            icon="checkCircle"
            variant="primary"
            onPress={confirm}
            style={styles.confirm}
          />
        </>
      ) : home.allTaken ? (
        <AllTakenCard tomorrowFirstTime={home.tomorrowFirstTime} />
      ) : (
        <Card style={styles.emptyCard}>
          <AppText size="subtitle" weight="bold" center>
            {home.hasMedications ? 'Bugün için başka ilacınız yok.' : 'Henüz ilacınız yok.'}
          </AppText>
          <AppText size="large" center color={Colors.textSecondary}>
            {home.hasMedications
              ? 'Yeni ilaç saati gelince burada görünür.'
              : 'İlaçlarınızı yakınınız ekleyecek.'}
          </AppText>
        </Card>
      )}

      {progress.total > 0 && <SimpleProgress taken={progress.taken} total={progress.total} />}
    </ScrollView>
  );
}

/** Stitch 14: bugünkü dozların hepsi alındı. */
function AllTakenCard({ tomorrowFirstTime }: { tomorrowFirstTime: string | null }) {
  return (
    <Card style={styles.doneCard}>
      <View style={styles.doneCircle}>
        <Icon name="check" size={88} color={Colors.success} />
      </View>
      <AppText size="heading" weight="bold" center>
        Bugünkü ilaçlarınızın hepsini aldınız
      </AppText>
      {tomorrowFirstTime && (
        <AppText size="subtitle" center color={Colors.textSecondary}>
          Yarın ilk ilacınız saat {tomorrowFirstTime}’da.
        </AppText>
      )}
      <View style={styles.donePill}>
        <Icon name="checkCircle" size={24} color={Colors.success} />
        <AppText size="large" weight="bold" color={Colors.success}>
          Tüm dozlar tamamlandı
        </AppText>
      </View>
    </Card>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerTexts: {
    flex: 1,
    gap: Spacing.one,
  },
  confirm: {
    minHeight: 72,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  doneCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  doneCircle: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.successSoft,
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Colors.successSoft,
  },
});
