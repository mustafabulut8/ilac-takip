import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

const TONES = {
  success: { background: Colors.successSoft, circle: Colors.success, icon: Colors.textOnColor },
  warning: { background: Colors.warningSoft, circle: Colors.warningIcon, icon: Colors.text },
  danger: { background: Colors.dangerSoft, circle: Colors.danger, icon: Colors.textOnColor },
  info: { background: Colors.primarySoft, circle: Colors.primary, icon: Colors.textOnColor },
} as const;

type BannerProps = {
  tone: keyof typeof TONES;
  icon: IconName;
  title: string;
  detail?: string;
  children?: ReactNode;
};

/** Renkli bilgi veya uyarı kutusu. */
export function Banner({ tone, icon, title, detail, children }: BannerProps) {
  const colors = TONES[tone];
  return (
    <View
      style={[styles.banner, { backgroundColor: colors.background }]}
      accessibilityLiveRegion="polite">
      <View style={styles.row}>
        <View style={[styles.circle, { backgroundColor: colors.circle }]}>
          <Icon name={icon} size={22} color={colors.icon} />
        </View>
        <View style={styles.texts}>
          <AppText weight="bold">{title}</AppText>
          {detail && <AppText size="small">{detail}</AppText>}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  circle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  texts: {
    flex: 1,
    gap: Spacing.one,
  },
});
