import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Dose } from '@/models';
import { missedAlertOf } from '@/utils/family';

import { AppText } from '../app-text';
import { Icon } from '../icon';

/**
 * Kırmızı uyarı: "Annem 09:00 dozunu almadı". Tasarımdaki "Annemi ara" düğmesi yok
 * (arayuz-tasarimi.md, "Tasarımdan farklı uygulanacaklar").
 */
export function MissedAlert({ dose, relation, now }: { dose: Dose; relation: string; now: Date }) {
  const { title, detail } = missedAlertOf(dose, relation, now);
  return (
    <View style={styles.card} accessible accessibilityLabel={`Uyarı: ${title}. ${detail}`}>
      <Icon name="warning" size={32} color={Colors.textOnColor} />
      <View style={styles.text}>
        <AppText weight="bold" color={Colors.textOnColor}>
          {title}
        </AppText>
        <AppText color={Colors.textOnColor}>{detail}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.button,
    backgroundColor: Colors.danger,
  },
  text: { flex: 1, gap: Spacing.one },
});
