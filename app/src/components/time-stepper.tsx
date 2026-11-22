import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { IconButton } from './icon-button';

type StepperColumnProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  max: number;
};

function StepperColumn({ label, value, onChange, step, max }: StepperColumnProps) {
  const button = { size: 56, color: Colors.textOnColor, background: Colors.primary };
  return (
    <View style={styles.column}>
      <AppText weight="bold">{label}</AppText>
      <IconButton
        icon="plus"
        accessibilityLabel={`${label} artır`}
        onPress={() => onChange((value + step) % max)}
        {...button}
      />
      <AppText size="huge" weight="extrabold" maxFontSizeMultiplier={1.3}>
        {String(value).padStart(2, '0')}
      </AppText>
      <IconButton
        icon="minus"
        accessibilityLabel={`${label} azalt`}
        onPress={() => onChange((value - step + max) % max)}
        {...button}
      />
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
    alignItems: 'center',
    gap: Spacing.two,
  },
});
