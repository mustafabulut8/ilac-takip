import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

type SimpleProgressProps = { taken: number; total: number };

/** "Bugün 1 / 3 ilaç alındı" ve çubuk. Yüzde yazılmaz (2. tur farkları). */
export function SimpleProgress({ taken, total }: SimpleProgressProps) {
  const done = total > 0 && taken === total;
  const color = done ? Colors.success : Colors.primary;
  return (
    <Card style={styles.card}>
      <AppText size="large" weight="semibold" color={Colors.textSecondary}>
        Bugün {taken} / {total} ilaç alındı
      </AppText>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: taken }}>
        <View
          style={[
            styles.fill,
            { width: `${total === 0 ? 0 : (taken / total) * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  track: {
    height: 12,
    overflow: 'hidden',
    borderRadius: Radius.pill,
    backgroundColor: Colors.neutralStrong,
  },
  fill: {
    height: '100%',
    minWidth: FontSize.small / 2,
    borderRadius: Radius.pill,
  },
});
