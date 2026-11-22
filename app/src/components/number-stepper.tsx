import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { formatNumber } from '@/models';

import { AppText } from './app-text';
import { IconButton } from './icon-button';

type NumberStepperProps = {
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

/** Büyük sayı ile eksi ve artı düğmeleri. */
export function NumberStepper({ value, unit, min, max, step, onChange }: NumberStepperProps) {
  return (
    <View style={styles.row}>
      <IconButton
        icon="minus"
        size={60}
        accessibilityLabel={`${unit} azalt`}
        disabled={value <= min}
        onPress={() => onChange(Math.max(value - step, min))}
        color={Colors.textOnColor}
        background={Colors.primary}
      />
      <View style={styles.value} accessible accessibilityLiveRegion="polite">
        <AppText size="huge" weight="extrabold" center maxFontSizeMultiplier={1.3}>
          {formatNumber(value)}
        </AppText>
        <AppText weight="semibold" color={Colors.textSecondary} center>
          {unit}
        </AppText>
      </View>
      <IconButton
        icon="plus"
        size={60}
        accessibilityLabel={`${unit} artır`}
        disabled={value >= max}
        onPress={() => onChange(Math.min(value + step, max))}
        color={Colors.textOnColor}
        background={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  value: {
    flex: 1,
  },
});
