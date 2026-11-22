import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { Pill } from './pill';

type SettingsRowProps = {
  icon: IconName;
  label: string;
  value?: string;
  /** Verilmezse satır pasiftir. */
  onPress?: () => void;
  /** Henüz yapılmamış özellik. */
  soon?: boolean;
  danger?: boolean;
};

/** Ayarlar satırı; "Yakında" olanlar basılamaz ve ekran okuyucuya pasif bildirilir. */
export function SettingsRow({ icon, label, value, onPress, soon, danger }: SettingsRowProps) {
  const color = danger ? Colors.danger : Colors.text;
  return (
    <Pressable
      accessibilityRole={onPress || soon ? 'button' : 'text'}
      accessibilityLabel={[label, value, soon && 'Yakında'].filter(Boolean).join(', ')}
      accessibilityState={{ disabled: !!soon }}
      disabled={!onPress || soon}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.tile, danger && styles.tileDanger]}>
        <Icon name={icon} size={24} color={danger ? Colors.danger : Colors.primary} />
      </View>
      <View style={styles.body}>
        <View style={styles.texts}>
          <AppText weight="semibold" color={color}>
            {label}
          </AppText>
          {value && (
            <AppText size="small" color={Colors.textSecondary}>
              {value}
            </AppText>
          )}
        </View>
        {soon && <Pill label="Yakında" align="center" />}
      </View>
      {onPress && !soon && <Icon name="forward" size={20} color={Colors.textSecondary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  tile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
  },
  tileDanger: {
    backgroundColor: Colors.dangerSoft,
  },
  // Yazı büyüyünce "Yakında" etiketi alt satıra geçer, ad harf arasından bölünmez.
  body: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  texts: {
    flexShrink: 1,
  },
});
