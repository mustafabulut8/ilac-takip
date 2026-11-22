import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { Card } from './card';
import { Pill } from './pill';

type AdherenceCardProps = { adherence: number | null; missed: number; isCurrentWeek: boolean };

/** Haftalık uyum: alınan / (alınan + kaçırılan). Bekleyen dozlar hesaba katılmaz. */
export function AdherenceCard({ adherence, missed, isCurrentWeek }: AdherenceCardProps) {
  const week = isCurrentWeek ? 'Bu hafta' : 'O hafta';
  if (adherence === null) {
    return (
      <Card>
        <AppText weight="bold">{week} sonuçlanmış doz yok.</AppText>
      </Card>
    );
  }
  return (
    <Card>
      <View style={styles.row}>
        <AppText size="subtitle" weight="bold">
          {week} uyum %{adherence}
        </AppText>
        <Pill
          label={`Kaçırılan doz: ${missed}`}
          color={missed > 0 ? Colors.danger : Colors.success}
          background={missed > 0 ? Colors.dangerSoft : Colors.successSoft}
        />
      </View>
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${week} uyum`}
        accessibilityValue={{ min: 0, max: 100, now: adherence }}>
        <View style={[styles.fill, { width: `${adherence}%` }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  track: {
    height: 16,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: Colors.neutralStrong,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
});
