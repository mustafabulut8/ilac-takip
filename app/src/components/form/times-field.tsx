import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/big-button';
import { TimeStepper } from '@/components/time-stepper';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { formatTime } from '@/utils/time';

import { FormField } from './form-field';

type TimesFieldProps = {
  times: string[];
  error?: string;
  onAdd: (time: string) => void;
  onRemove: (time: string) => void;
  onLayoutY?: (y: number) => void;
};

/** Saat seçici, "Saatini Ekle" butonu ve eklenen saatlerin listesi. */
export function TimesField({ times, error, onAdd, onRemove, onLayoutY }: TimesFieldProps) {
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const selected = formatTime(hour, minute);

  return (
    <FormField label="Günlük saatler" error={error} onLayoutY={onLayoutY}>
      <TimeStepper hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} />
      <BigButton label={`${selected} Saatini Ekle`} onPress={() => onAdd(selected)} />
      {times.map((time) => (
        <View key={time} style={styles.timeRow}>
          <Text style={styles.time}>{time}</Text>
          <BigButton
            label={`${time} Kaldır`}
            color={Colors.danger}
            onPress={() => onRemove(time)}
          />
        </View>
      ))}
    </FormField>
  );
}

const styles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  time: {
    color: Colors.text,
    fontSize: FontSize.title,
    fontWeight: '700',
  },
});
