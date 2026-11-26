import { Pressable, StyleSheet } from 'react-native';

import { Colors, MinTouchSize, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

type TextLinkProps = {
  label: string;
  onPress: () => void;
  /** Bağlantıdan önce düz yazı ("Hesabınız yok mu?" gibi). */
  prefix?: string;
  align?: 'center' | 'flex-start' | 'flex-end';
};

/** Altı çizili turkuaz bağlantı; dokunma alanı en az 48pt. */
export function TextLink({ label, onPress, prefix, align = 'center' }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={prefix ? `${prefix} ${label}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.link, { alignSelf: align }, pressed && styles.pressed]}>
      <AppText center color={Colors.primary}>
        {prefix ? `${prefix} · ` : ''}
        <AppText weight="bold" color={Colors.primary} style={styles.underline}>
          {label}
        </AppText>
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: MinTouchSize,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});
