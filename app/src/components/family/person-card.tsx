import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { FamilyPerson } from '@/hooks/useFamilyDashboard';
import type { Dose, UserRole } from '@/models';
import { initialsOf, reminderWarningOf } from '@/utils/family';

import { AppText } from '../app-text';
import { Banner } from '../banner';
import { Card } from '../card';
import { Icon, type IconName } from '../icon';
import { Pill } from '../pill';
import { PrimaryButton } from '../primary-button';
import { SecondaryButton } from '../secondary-button';
import { statusLook } from '../status-chip';

const MODE_LABEL: Record<UserRole, string> = {
  sade: 'Sade mod',
  standart: 'Standart mod',
  aile: 'Aile',
};

const STATUS_ICON: Record<Dose['status'], IconName> = {
  alindi: 'check',
  kacirildi: 'close',
  bekliyor: 'clock',
  yarin: 'calendar',
};

export const UNDELIVERED_NOTE = 'Henüz telefona ulaşmadı';

function DoseRow({ dose, undelivered }: { dose: Dose; undelivered: boolean }) {
  const look = statusLook(dose);
  return (
    <View style={styles.doseRow}>
      <View style={[styles.doseIcon, { backgroundColor: look.background }]}>
        <Icon name={STATUS_ICON[dose.status]} size={24} color={look.color} />
      </View>
      <View style={styles.flex}>
        <AppText weight="bold">{dose.time}</AppText>
        <AppText color={Colors.textSecondary}>
          {[dose.medication.name, dose.medication.dose].filter(Boolean).join(' ')}
        </AppText>
        {undelivered && <AppText color={Colors.pending}>{UNDELIVERED_NOTE}</AppText>}
      </View>
      <Pill label={look.label} color={look.color} background={look.background} />
    </View>
  );
}

function Progress({ taken, total }: { taken: number; total: number }) {
  const text = `Bugün ${taken} / ${total} ilaç alındı`;
  return (
    <View style={styles.progress}>
      <AppText color={Colors.textSecondary}>{text}</AppText>
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={text}
        accessibilityValue={{ min: 0, max: Math.max(total, 1), now: taken }}>
        <View style={[styles.fill, { flex: total === 0 ? 0 : taken / total }]} />
      </View>
    </View>
  );
}

function PersonActions({ person, online }: { person: FamilyPerson; online: boolean }) {
  const params = { kisiId: person.link.personId, ad: person.link.name };
  return (
    <View style={styles.actions}>
      <PrimaryButton
        label="İlaç ekle"
        icon="plus"
        disabled={!online}
        accessibilityLabel={`${person.link.name} için ilaç ekle`}
        onPress={() => router.push({ pathname: '/yakin/[kisiId]/ilac-ekle', params })}
        style={styles.flex}
      />
      <SecondaryButton
        label="İlaçları yönet"
        accessibilityLabel={`${person.link.name}: ilaçları yönet`}
        onPress={() => router.push({ pathname: '/yakin/[kisiId]', params })}
        style={styles.flex}
      />
    </View>
  );
}

function SummaryBody({ person, now }: { person: FamilyPerson; now: Date }) {
  const { summary } = person;
  if (summary === null) return <AppText color={Colors.textSecondary}>Yükleniyor…</AppText>;
  if (summary === 'error') {
    return <AppText color={Colors.danger}>Bilgiler alınamadı. Biraz sonra tekrar deneyin.</AppText>;
  }
  const warning = reminderWarningOf(summary.remindersUntil, person.link.relationLabel, now);
  return (
    <>
      {warning && <Banner tone="warning" icon="bell" title={warning} />}
      <Progress {...summary.progress} />
      {summary.doses.length === 0 && (
        <AppText color={Colors.textSecondary}>Bugün için planlanmış doz yok.</AppText>
      )}
      {summary.doses.map((dose) => (
        <DoseRow
          key={`${dose.medication.id}-${dose.date}-${dose.time}`}
          dose={dose}
          undelivered={summary.undeliveredIds.includes(dose.medication.id)}
        />
      ))}
    </>
  );
}

/** Aile Paneli'nde her yakın için ayrı kart. */
export function PersonCard({
  person,
  online,
  now,
}: {
  person: FamilyPerson;
  online: boolean;
  now: Date;
}) {
  const { link } = person;
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText weight="bold" color={Colors.primary}>
            {initialsOf(link.name)}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText size="subtitle" weight="bold">
            {link.name}
          </AppText>
          <AppText color={Colors.textSecondary}>
            {link.relationLabel} · {MODE_LABEL[link.role]}
          </AppText>
        </View>
      </View>
      <SummaryBody person={person} now={now} />
      <PersonActions person={person} online={online} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.selectedSoft,
  },
  flex: { flex: 1 },
  progress: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.button,
    backgroundColor: Colors.background,
  },
  track: {
    flexDirection: 'row',
    height: 12,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: Colors.neutralStrong,
  },
  fill: { borderRadius: Radius.pill, backgroundColor: Colors.accent },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.button,
    backgroundColor: Colors.background,
  },
  doseIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
});
