import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useMedicationPhoto } from '@/hooks/useMedicationPhoto';
import { getMedicationForm, MEAL_TIMING_LABELS, type Medication } from '@/models';
import { atTime, formatDate, formatDayMonth, parseDate } from '@/utils/date';
import { dayPeriodOf, type DayPeriod } from '@/utils/time';

import { AppText } from './app-text';
import { Banner } from './banner';
import { Card } from './card';
import { FieldError } from './form/field-error';
import { Icon } from './icon';
import { IconButton } from './icon-button';
import { Pill } from './pill';
import { PrimaryButton } from './primary-button';
import { SecondaryButton } from './secondary-button';

const PERIOD_TITLES: Record<DayPeriod, string> = {
  morning: 'Sabah ilacı',
  noon: 'Öğle ilacı',
  evening: 'Akşam ilacı',
};
const NOW_WINDOW_MS = 30 * 60 * 1000;

/** "Şimdi · 13:00"; saati uzaksa "Saat 13:00", başka günse "22 Kasım · 13:00". */
function timeLabel(date: string, time: string, now: Date) {
  const day = parseDate(date);
  if (day && date !== formatDate(now)) return `${formatDayMonth(day)} · ${time}`;
  const distance = Math.abs(now.getTime() - atTime(now, time).getTime());
  return distance <= NOW_WINDOW_MS ? `Şimdi · ${time}` : `Saat ${time}`;
}

type DosePromptProps = {
  medication: Medication;
  date: string;
  time: string;
  now: Date;
  error: string | null;
  isSnoozed: boolean;
  onConfirm: () => void;
  onSnooze: () => void;
  onClose: () => void;
};

/** İlaç zamanı: büyük fotoğraf, doz ve onay. Metinler ilacın formundan gelir. */
export function DosePrompt({
  medication,
  date,
  time,
  now,
  error,
  isSnoozed,
  onConfirm,
  onSnooze,
  onClose,
}: DosePromptProps) {
  const insets = useSafeAreaInsets();
  const photoUri = useMedicationPhoto(medication.photoFile, medication.photoPath);
  const form = getMedicationForm(medication.form);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pill
          label={timeLabel(date, time, now)}
          icon="clock"
          color={Colors.text}
          background={Colors.accentSoft}
          align="center"
        />
        <IconButton icon="close" accessibilityLabel="Kapat" onPress={onClose} />
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View>
          {photoUri ? (
            <Image
              source={photoUri}
              style={styles.photo}
              contentFit="cover"
              accessibilityLabel={`${medication.name} fotoğrafı`}
            />
          ) : (
            <View style={[styles.photo, styles.placeholder]}>
              <Icon name={form.kind} size={110} color={Colors.primary} />
            </View>
          )}
          <View style={styles.badge}>
            <Pill
              label={PERIOD_TITLES[dayPeriodOf(time)]}
              icon={dayPeriodOf(time)}
              color={Colors.text}
              background={Colors.card}
            />
          </View>
        </View>
        <AppText size="title" weight="bold" center accessibilityRole="header">
          {medication.name}
        </AppText>
        <Pill
          label={[medication.dose, form.label].filter(Boolean).join(' · ')}
          icon={form.kind}
          color={Colors.primary}
          background={Colors.primarySoft}
          align="center"
        />
        {medication.mealTiming !== 'any' && (
          <Card style={styles.usage}>
            <Icon name="meal" size={30} color={Colors.primary} />
            <View style={styles.flex}>
              <AppText size="small" color={Colors.textSecondary}>
                Kullanım şekli
              </AppText>
              <AppText weight="bold">{MEAL_TIMING_LABELS[medication.mealTiming]}</AppText>
            </View>
          </Card>
        )}
        {isSnoozed && (
          <Banner
            tone="info"
            icon="snooze"
            title="Ertelendi"
            detail="10 dakika sonra tekrar hatırlatılacak."
          />
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
        <FieldError message={error} />
        <PrimaryButton
          label={form.confirmLabel()}
          icon="check"
          accessibilityLabel={form.confirmAccessibilityLabel(medication.name)}
          onPress={onConfirm}
        />
        <SecondaryButton
          label="10 dakika sonra hatırlat"
          icon="snooze"
          variant="neutral"
          compact
          onPress={onSnooze}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.screen,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.screen,
  },
  photo: {
    width: '100%',
    height: 256,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
  },
  usage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    gap: 12,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
});
