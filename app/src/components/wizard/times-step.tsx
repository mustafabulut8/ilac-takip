import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Chip, ChipGroup } from '@/components/chip-group';
import { Icon } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { TimeStepper } from '@/components/time-stepper';
import { Colors, Spacing } from '@/constants/theme';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';
import { DAY_PERIOD_LABELS, dayPeriodOf, formatTime } from '@/utils/time';

import { StepTitle } from './step-title';

const QUICK_TIMES = [
  { label: 'Günde 1 kez', times: ['09:00'] },
  { label: 'Günde 2 kez', times: ['08:00', '20:00'] },
  { label: 'Günde 3 kez', times: ['08:00', '14:00', '20:00'] },
];

export function TimesStep({ wizard }: { wizard: MedicationWizard }) {
  const { times } = wizard.draft;
  const { update } = wizard;
  const [isAdding, setIsAdding] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const selected = formatTime(hour, minute);

  const addTime = () => {
    update({ times: [...new Set([...times, selected])].sort() });
    setIsAdding(false);
  };

  return (
    <>
      <StepTitle title="Hangi saatlerde alacaksınız?" />
      {times.map((time, index) => (
        <Card key={time} style={styles.timeCard}>
          <Icon name={dayPeriodOf(time)} size={28} color={Colors.primary} />
          <View style={styles.flex}>
            <AppText size="small" color={Colors.textSecondary}>
              {index + 1}. {DAY_PERIOD_LABELS[dayPeriodOf(time)]} dozu
            </AppText>
            <AppText size="title" weight="bold">
              {time}
            </AppText>
          </View>
          <IconButton
            icon="close"
            accessibilityLabel={`${time} saatini kaldır`}
            color={Colors.danger}
            background={Colors.dangerSoft}
            onPress={() => update({ times: times.filter((item) => item !== time) })}
          />
        </Card>
      ))}

      {isAdding ? (
        <Card>
          <TimeStepper
            hour={hour}
            minute={minute}
            onHourChange={setHour}
            onMinuteChange={setMinute}
          />
          <PrimaryButton label={`${selected} saatini ekle`} icon="plus" onPress={addTime} />
          <SecondaryButton
            label="Vazgeç"
            variant="neutral"
            compact
            onPress={() => setIsAdding(false)}
          />
        </Card>
      ) : (
        <SecondaryButton
          label={times.length === 0 ? 'Saat ekle' : 'Başka bir saat ekle'}
          icon="plus"
          onPress={() => setIsAdding(true)}
        />
      )}

      <AppText weight="bold">Hızlı saat seçenekleri</AppText>
      <ChipGroup>
        {QUICK_TIMES.map((option) => (
          <Chip
            key={option.label}
            label={`${option.label} (${option.times.join(', ')})`}
            selected={option.times.join() === times.join()}
            onPress={() => update({ times: option.times })}
          />
        ))}
      </ChipGroup>
    </>
  );
}

const styles = StyleSheet.create({
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
});
