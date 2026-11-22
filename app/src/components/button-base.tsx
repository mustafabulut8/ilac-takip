import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { Colors, MinButtonHeight, MinTouchSize, Radius, Shadow, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

const VARIANTS = {
  primary: { background: Colors.primary, text: Colors.textOnColor, border: Colors.primary },
  danger: { background: Colors.danger, text: Colors.textOnColor, border: Colors.danger },
  neutral: { background: Colors.neutralStrong, text: Colors.text, border: Colors.neutralStrong },
  outline: { background: Colors.card, text: Colors.primary, border: Colors.primary },
  dangerOutline: { background: Colors.card, text: Colors.danger, border: Colors.danger },
} as const;

export type ButtonBaseProps = {
  label: string;
  onPress: () => void;
  variant: keyof typeof VARIANTS;
  icon?: IconName;
  /** İkincil eylemlerde 48pt yükseklik. */
  compact?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Ana ve ikincil butonların ortak gövdesi; ekranlar Primary/SecondaryButton kullanır. */
export function ButtonBase({
  label,
  onPress,
  variant,
  icon,
  compact,
  disabled,
  accessibilityLabel = label,
  style,
}: ButtonBaseProps) {
  const { background, text, border } = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: border },
        compact && styles.compact,
        variant === 'primary' && !disabled && styles.raised,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {icon && <Icon name={icon} size={22} color={text} />}
      <AppText weight="bold" color={text} center style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MinButtonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.button,
    borderWidth: 2,
  },
  compact: {
    minHeight: MinTouchSize,
  },
  raised: {
    boxShadow: Shadow.primaryButton,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    flexShrink: 1,
  },
});
