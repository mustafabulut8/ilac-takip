import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { getMedicationForm, type Medication } from '@/models';
import { formatDate } from '@/utils/date';
import { describeDuration, describeSchedule, lastDayOf } from '@/utils/schedule';

import { AppText } from './app-text';
import { Card } from './card';
import { Icon, type IconName } from './icon';
import { IconButton } from './icon-button';
import { MedicationPhoto } from './medication-photo';
import { Pill } from './pill';
import { SecondaryButton } from './secondary-button';

type MedicationCardProps = {
  medication: Medication;
  onToggleMarkedLow: () => void;
  onRemove: () => void;
};

function InfoRow({ icon, text, color }: { icon: IconName; text: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color={color ?? Colors.primary} />
      <AppText weight="semibold" color={color} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

/** İlaçlarım ekranındaki kart: plan, stok ve işlemler. */
export function MedicationCard({ medication, onToggleMarkedLow, onRemove }: MedicationCardProps) {
  const form = getMedicationForm(medication.form);
  const isLow = form.isRunningLow(medication);
  const stockLabel = form.stockLabel(medication.stock);
  const lastDay = lastDayOf(medication);
  const isFinished = lastDay !== null && formatDate(lastDay) < formatDate(new Date());
  const schedule = [medication.times.join(' · '), describeSchedule(medication)]
    .filter(Boolean)
    .join(' · ');

  const confirmRemove = () =>
    Alert.alert(
      `${medication.name} silinsin mi?`,
      'İlaç, fotoğrafı ve hatırlatmaları silinir. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: onRemove },
      ],
    );

  const showInfoNotice = () =>
    Alert.alert('Yakında', 'İlaç bilgisi sonraki sürümde eklenecek.', [{ text: 'Tamam' }]);

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <MedicationPhoto medication={medication} badgeSize={28} />
        <View style={styles.details}>
          <AppText size="subtitle" weight="bold">
            {medication.name}
          </AppText>
          <AppText color={Colors.textSecondary}>
            {[form.label, medication.dose].filter(Boolean).join(' · ')}
          </AppText>
          {isFinished && <Pill label="Süresi tamamlandı" icon="check" />}
          {isLow && (
            <Pill
              label="Bitmek üzere"
              icon="warning"
              color={Colors.pending}
              background={Colors.warningSoft}
            />
          )}
        </View>
      </View>
      <InfoRow icon="clock" text={schedule} />
      {medication.duration.kind === 'days' && (
        <InfoRow icon="hourglass" text={describeDuration(medication)} />
      )}
      {stockLabel && (
        <InfoRow icon="box" text={stockLabel} color={isLow ? Colors.pending : Colors.success} />
      )}
      {!form.isCountable() && (
        <SecondaryButton
          label={
            medication.markedLow
              ? '“Bitmek üzere” işaretini kaldır'
              : 'Bitmek üzere olarak işaretle'
          }
          variant="neutral"
          compact
          onPress={onToggleMarkedLow}
        />
      )}
      <View style={styles.actions}>
        <SecondaryButton
          label="İlaç bilgisi"
          icon="info"
          compact
          accessibilityLabel={`${medication.name}: ilaç bilgisi, yakında`}
          onPress={showInfoNotice}
          style={styles.action}
        />
        <SecondaryButton
          label="Düzenle"
          icon="edit"
          compact
          accessibilityLabel={`${medication.name}: düzenle`}
          onPress={() =>
            router.push({ pathname: '/ilac-duzenle/[id]', params: { id: medication.id } })
          }
          style={styles.action}
        />
        <IconButton
          icon="trash"
          accessibilityLabel={`${medication.name}: sil`}
          color={Colors.danger}
          background={Colors.dangerSoft}
          onPress={confirmRemove}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  details: {
    flex: 1,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  action: {
    flexGrow: 1,
    paddingHorizontal: Spacing.two,
  },
});
