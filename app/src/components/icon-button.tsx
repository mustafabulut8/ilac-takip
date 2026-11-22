import { Pressable, StyleSheet } from 'react-native';

import { Colors, MinTouchSize, Radius } from '@/constants/theme';

import { Icon, type IconName } from './icon';

type IconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  background?: string;
};

/** Yuvarlak, en az 48pt ikon düğmesi. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled,
  size = MinTouchSize,
  color = Colors.text,
  background = Colors.neutralStrong,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, backgroundColor: background },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Icon name={icon} size={Math.round(size * 0.45)} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  dimmed: {
    opacity: 0.4,
  },
});
