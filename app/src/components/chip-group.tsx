import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, MinTouchSize, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

type ChipProps = {
  label: string;
  onPress: () => void;
  selected?: boolean;
  /** Birden çok seçilebilen grupta "checkbox" olur. */
  multiple?: boolean;
  accessibilityLabel?: string;
};

/** Yuvarlak hızlı seçim düğmesi. */
export function Chip({ label, onPress, selected, multiple, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={multiple ? { checked: !!selected } : { selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}>
      <AppText weight="semibold" color={selected ? Colors.textOnColor : Colors.text} center>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Sığmayınca alt satıra geçen düğme grubu. */
export function ChipGroup(props: ViewProps) {
  return <View {...props} style={styles.row} />;
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MinTouchSize + 4,
    minWidth: 68,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  selected: {
    backgroundColor: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
