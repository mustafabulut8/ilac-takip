import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';

import { Colors, FontSize, MinButtonHeight, Spacing } from '@/constants/theme';

type BigButtonProps = {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BigButton({ label, onPress, color = Colors.primary, disabled, style }: BigButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color },
        (pressed || disabled) && styles.dimmed,
        style,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MinButtonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  dimmed: {
    opacity: 0.6,
  },
  label: {
    color: Colors.textOnColor,
    fontSize: FontSize.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
