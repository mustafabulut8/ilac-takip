import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { ButtonBase } from '@/components/button-base';
import { Card } from '@/components/card';
import { HomeAlerts } from '@/components/home-alerts';
import { Icon } from '@/components/icon';
import { SettingsButton } from '@/components/settings-button';
import { SimpleDoseCard } from '@/components/simple/simple-dose-card';
import { SimpleProgress } from '@/components/simple/simple-progress';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
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
  const home = useSimpleHome();
  if (!home.isLoaded) return null;

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
            {greetingFor(home.now, profile?.name)}
          </AppText>
          <AppText size="large" color={Colors.textSecondary}>
            {formatLongDate(home.now)}
          </AppText>
        </View>
        <SettingsButton />
      </View>

      <HomeAlerts />
      {home.lastTaken && (
        <Banner tone="success" icon="check" title={`${home.lastTaken} alındı olarak kaydedildi.`} />
      )}

      <FocusSection home={home} />

      {home.progress.total > 0 && (
        <SimpleProgress taken={home.progress.taken} total={home.progress.total} />
      )}
    </ScrollView>
  );
}

type SimpleHome = ReturnType<typeof useSimpleHome>;

/** Gösterilecek doz ve büyük onay düğmesi; doz yoksa tebrik veya boş kart. */
function FocusSection({ home }: { home: SimpleHome }) {
  const { focus } = home;
  if (!focus) {
    return home.allTaken ? (
      <AllTakenCard tomorrowFirstTime={home.tomorrowFirstTime} />
    ) : (
      <EmptyCard hasMedications={home.hasMedications} />
    );
  }
  const form = getMedicationForm(focus.medication.form);
  return (
    <>
      <SimpleDoseCard dose={focus} lateMinutes={home.lateMinutes} />
      {home.error && (
        <AppText size="large" weight="bold" color={Colors.danger}>
          {home.error}
        </AppText>
      )}
      <ButtonBase
        label={form.confirmLabel()}
        accessibilityLabel={form.confirmAccessibilityLabel(focus.medication.name)}
        icon="checkCircle"
        variant="primary"
        onPress={home.confirmFocus}
        style={styles.confirm}
      />
    </>
  );
}

/** Bugün gösterilecek doz yok: ilaç hiç yoksa yakının ekleyeceği söylenir. */
function EmptyCard({ hasMedications }: { hasMedications: boolean }) {
  return (
    <Card style={styles.emptyCard}>
      <AppText size="subtitle" weight="bold" center>
        {hasMedications ? 'Bugün için başka ilacınız yok.' : 'Henüz ilacınız yok.'}
      </AppText>
      <AppText size="large" center color={Colors.textSecondary}>
        {hasMedications
          ? 'Yeni ilaç saati gelince burada görünür.'
          : 'İlaçlarınızı yakınınız ekleyecek.'}
      </AppText>
    </Card>
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
