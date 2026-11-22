import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type OptionCardProps = {
  label: string;
  detail?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  /** Izgarada ikon üstte, yazı altta. */
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Tek seçimli büyük kart; seçim hem renk hem onay işaretiyle belli olur. */
export function OptionCard({
  label,
  detail,
  icon,
  selected,
  onPress,
  vertical,
  style,
}: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        vertical && styles.vertical,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}>
      {icon && (
        <View style={[styles.circle, selected && styles.circleSelected]}>
          <Icon name={icon} size={28} color={selected ? Colors.textOnColor : Colors.primary} />
        </View>
      )}
      <View style={vertical ? undefined : styles.texts}>
        <AppText weight="bold" center={vertical}>
          {label}
        </AppText>
        {detail && (
          <AppText size="small" color={Colors.textSecondary} center={vertical}>
            {detail}
          </AppText>
        )}
      </View>
      {selected && (
        <View style={[styles.check, vertical && styles.checkCorner]}>
          <Icon name="check" size={16} color={Colors.textOnColor} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 3,
    borderColor: Colors.card,
    backgroundColor: Colors.card,
    boxShadow: Shadow.card,
  },
  vertical: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 128,
  },
  selected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  circle: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  circleSelected: {
    backgroundColor: Colors.primary,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  check: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  checkCorner: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
});
