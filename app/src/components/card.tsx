import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

/** Beyaz, gölgeli kart. */
export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.screen,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    boxShadow: Shadow.card,
  },
});
