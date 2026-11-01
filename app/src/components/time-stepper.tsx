import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/big-button';
import { Colors, FontSize, Spacing } from '@/constants/theme';

type StepperColumnProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  max: number;
};

function StepperColumn({ label, value, onChange, step, max }: StepperColumnProps) {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <BigButton label={`${label} artır`} onPress={() => onChange((value + step) % max)} />
      <Text style={styles.value}>{String(value).padStart(2, '0')}</Text>
      <BigButton label={`${label} azalt`} onPress={() => onChange((value - step + max) % max)} />
    </View>
  );
}

type TimeStepperProps = {
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
};

export function TimeStepper({ hour, minute, onHourChange, onMinuteChange }: TimeStepperProps) {
  return (
    <View style={styles.row}>
      <StepperColumn label="Saat" value={hour} onChange={onHourChange} step={1} max={24} />
      <StepperColumn label="Dakika" value={minute} onChange={onMinuteChange} step={5} max={60} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  column: {
    flex: 1,
    gap: Spacing.two,
  },
  label: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  value: {
    color: Colors.text,
    fontSize: FontSize.huge,
    fontWeight: '700',
    textAlign: 'center',
  },
});
