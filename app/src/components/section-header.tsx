import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

/** Bölüm başlığı: ikon, ad ve isteğe bağlı açıklama (ör. saat aralığı). */
export function SectionHeader({
  title,
  detail,
  icon,
}: {
  title: string;
  detail?: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.row}>
      {icon && (
        <View style={styles.circle}>
          <Icon name={icon} size={22} color={Colors.primary} />
        </View>
      )}
      <View style={styles.texts}>
        <AppText size="subtitle" weight="bold" accessibilityRole="header">
          {title}
        </AppText>
        {detail && (
          <AppText size="small" color={Colors.textSecondary}>
            {detail}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  texts: {
    flex: 1,
  },
});
