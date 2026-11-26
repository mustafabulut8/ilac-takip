import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, MinTouchSize, Radius, Shadow, Spacing } from '@/constants/theme';
import { getMedicationForm, MEAL_TIMING_LABELS, type Dose } from '@/models';
import { DAY_PERIOD_LABELS, dayPeriodOf } from '@/utils/time';

import { AppText } from './app-text';
import { Icon } from './icon';
import { MedicationPhoto } from './medication-photo';
import { Pill } from './pill';
import { PrimaryButton } from './primary-button';
import { StatusChip, statusLook } from './status-chip';

type DoseCardProps = {
  dose: Dose;
  /** Verilmezse kart dokunulamaz (Geçmiş). */
  onPress?: () => void;
  /** Sıradaki doz vurgulanır ve onay butonu gösterilir. */
  isNext?: boolean;
};

export function DoseCard({ dose, onPress, isNext }: DoseCardProps) {
  const { medication, time } = dose;
  const look = statusLook(dose);
  const meal = medication.mealTiming === 'any' ? '' : MEAL_TIMING_LABELS[medication.mealTiming];
  const detail = [medication.dose, meal].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, isNext && styles.next]}>
      {isNext && <View style={styles.accentBar} />}
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessible
        accessibilityLabel={`${medication.name}, ${detail}, saat ${time}, ${look.label}`}
        disabled={!onPress || dose.status === 'yarin'}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <MedicationPhoto medication={medication} />
        <View style={styles.details}>
          {isNext && (
            <Pill label="Sıradaki doz" color={Colors.text} background={Colors.accentSoft} />
          )}
          <AppText size="subtitle" weight="bold">
            {medication.name}
          </AppText>
          {detail !== '' && <AppText color={Colors.textSecondary}>{detail}</AppText>}
          <View style={styles.time}>
            <Icon name="clock" size={20} color={Colors.primary} />
            <AppText weight="semibold">
              {time} · {DAY_PERIOD_LABELS[dayPeriodOf(time)]}
            </AppText>
          </View>
          <StatusChip dose={dose} />
        </View>
      </Pressable>
      {isNext && onPress && (
        <PrimaryButton
          label={`Şimdi ${getMedicationForm(medication.form).confirmLabel()}`}
          icon="check"
          onPress={onPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.screen,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    boxShadow: Shadow.card,
  },
  next: {
    overflow: 'hidden',
    paddingTop: Spacing.screen + 6,
    boxShadow: Shadow.activeCard,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: Colors.accent,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    // İçerik zaten daha yüksek; en küçük dokunma alanı yine de garanti edilir.
    minHeight: MinTouchSize,
  },
  pressed: {
    opacity: 0.7,
  },
  details: {
    flex: 1,
    gap: 6,
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
