import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { Card } from '@/components/card';
import { MissedAlert } from '@/components/family/missed-alert';
import { PersonCard } from '@/components/family/person-card';
import { FieldError } from '@/components/form/field-error';
import { Icon } from '@/components/icon';
import { OFFLINE_MESSAGE } from '@/components/needs-internet';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { SettingsButton } from '@/components/settings-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFamilyDashboard, type FamilyPerson } from '@/hooks/useFamilyDashboard';
import { useNow } from '@/hooks/useNow';
import { useOnline } from '@/hooks/useOnline';
import { greetingFor } from '@/utils/time';

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

/** Her yakının kaçırılan dozları; panel her açıldığında yeniden hesaplanır. */
function MissedAlerts({ people, now }: { people: FamilyPerson[]; now: Date }) {
  return people.flatMap(({ link, summary }) =>
    summary && summary !== 'error'
      ? summary.missed.map((dose) => (
          <MissedAlert
            key={`${link.id}-${dose.medication.id}-${dose.date}-${dose.time}`}
            dose={dose}
            relation={link.relationLabel}
            now={now}
          />
        ))
      : [],
  );
}

/** Bağlı yakınların kartları; hiç yoksa boş durum. */
function People({ people, online }: { people: FamilyPerson[]; online: boolean }) {
  if (people.length === 0) return <EmptyState />;
  return (
    <>
      <AppText size="subtitle" weight="bold" accessibilityRole="header">
        {people.length === 1 ? 'Takip ettiğiniz kişi' : 'Takip ettiğiniz kişiler'}
      </AppText>
      {people.map((person) => (
        <PersonCard key={person.link.id} person={person} online={online} />
      ))}
      <SecondaryButton
        label="Başka bir yakınımı bağla"
        icon="link"
        onPress={() => router.push('/kodla-baglan')}
      />
    </>
  );
}

/**
 * Aile Paneli: kaçırılan doz uyarıları ve her yakın için ayrı kişi kartı.
 *
 * Kaçırılan dozlar şimdilik yalnızca panel açıldığında hesaplanır. Uygulama kapalıyken
 * sunucu taraflı tespit ve e-posta bildirimi 3. parçada gelecek (docs/ilerleme.md).
 */
export default function FamilyHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const now = useNow();
  const online = useOnline();
  const { people, error } = useFamilyDashboard();

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
        <FieldError message={error} />
        {!online && <Banner tone="warning" icon="warning" title={OFFLINE_MESSAGE} />}
        {people && <MissedAlerts people={people} now={now} />}
        {people && <People people={people} online={online} />}
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
  circle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.selectedSoft,
  },
});
