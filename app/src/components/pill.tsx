import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type PillProps = { label: string; icon?: IconName; color?: string; background?: string };

/** Tam yuvarlak etiket. */
export function Pill({
  label,
  icon,
  color = Colors.textSecondary,
  background = Colors.neutralSoft,
}: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon && <Icon name={icon} size={18} color={color} />}
      <AppText size="small" weight="bold" color={color} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  label: {
    flexShrink: 1,
  },
});
