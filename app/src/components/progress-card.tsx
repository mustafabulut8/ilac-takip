import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { Card } from './card';
import { ProgressRing } from './progress-ring';

type Progress = { total: number; taken: number; remaining: number; percent: number };

/** Yalnızca gerçekten olanı söyler: kaçırılan doz varken "hepsi tamam" denmez. */
function captionOf({ total, taken, remaining }: Progress) {
  if (taken === total) return 'Bugünkü dozların hepsini aldınız, harika!';
  return remaining > 0 ? `Bugün ${remaining} dozunuz kaldı.` : 'Bugün bekleyen dozunuz yok.';
}

/** Günün ilerlemesi: halka ve "Bugün 2 / 4 doz alındı". */
export function ProgressCard({ progress }: { progress: Progress }) {
  return (
    <Card style={styles.card}>
      <ProgressRing percent={progress.percent} />
      <View style={styles.texts}>
        <AppText size="small" color={Colors.textSecondary}>
          Günün ilerlemesi
        </AppText>
        <AppText weight="bold">
          Bugün {progress.taken} / {progress.total} doz alındı
        </AppText>
        <AppText size="small">{captionOf(progress)}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.screen,
  },
  texts: {
    flex: 1,
    gap: Spacing.one,
  },
});
