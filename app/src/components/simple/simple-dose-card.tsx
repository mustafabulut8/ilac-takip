import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { MedicationPhoto } from '@/components/medication-photo';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { MEAL_TIMING_LABELS, type Dose } from '@/models';
import { formatMinutes } from '@/utils/time';

type SimpleDoseCardProps = {
  dose: Dose;
  /** Saatinden bu yana geçen dakika; 0'dan büyükse kırmızı "geçti" yazılır. */
  lateMinutes: number;
};

/** Sade mod: sıradaki tek ilacın büyük kartı (Stitch 13 ve 15). En küçük yazı 20pt. */
export function SimpleDoseCard({ dose, lateMinutes }: SimpleDoseCardProps) {
  const { medication, time } = dose;
  const late = lateMinutes > 0;
  const meal = medication.mealTiming === 'any' ? '' : MEAL_TIMING_LABELS[medication.mealTiming];
  const detail = [medication.dose, meal].filter(Boolean).join(' · ');
  const timeText = late ? `Saat ${time} · ${formatMinutes(lateMinutes)} geçti` : `Saat ${time}`;
  const timeColor = late ? Colors.danger : Colors.primary;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <AppText size="subtitle" weight="semibold" color={Colors.textSecondary}>
          Sıradaki ilacınız
        </AppText>
        {late && (
          <View style={styles.lateBadge}>
            <Icon name="warning" size={22} color={Colors.danger} />
            <AppText size="large" weight="bold" color={Colors.danger}>
              Saati geçti
            </AppText>
          </View>
        )}
      </View>
      <Card style={styles.card}>
        <View style={styles.photo}>
          <MedicationPhoto medication={medication} size={180} badgeSize={40} />
        </View>
        <AppText size="title" weight="bold">
          {medication.name}
        </AppText>
        {detail ? (
          <AppText size="subtitle" color={Colors.textSecondary}>
            {detail}
          </AppText>
        ) : null}
        <View style={styles.timeRow}>
          <Icon name="clock" size={28} color={timeColor} />
          <AppText size="heading" weight="bold" color={timeColor} style={styles.timeText}>
            {timeText}
          </AppText>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  lateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.dangerSoft,
  },
  card: {
    gap: Spacing.two,
  },
  photo: {
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  timeText: {
    flexShrink: 1,
  },
});
