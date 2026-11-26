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

/** Normal ve tehlikeli (ör. çıkış) satırın renkleri. */
const NORMAL_TONE = { text: Colors.text, icon: Colors.primary, tile: Colors.primarySoft };
const DANGER_TONE = { text: Colors.danger, icon: Colors.danger, tile: Colors.dangerSoft };

/** Ayarlar satırı; "Yakında" olanlar basılamaz ve ekran okuyucuya pasif bildirilir. */
export function SettingsRow({ icon, label, value, onPress, soon, danger }: SettingsRowProps) {
  const tone = danger ? DANGER_TONE : NORMAL_TONE;
  const opens = !!onPress && !soon;
  return (
    <Pressable
      accessibilityRole={onPress || soon ? 'button' : 'text'}
      accessibilityLabel={[label, value, soon && 'Yakında'].filter(Boolean).join(', ')}
      accessibilityState={{ disabled: !!soon }}
      disabled={!opens}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.tile, { backgroundColor: tone.tile }]}>
        <Icon name={icon} size={24} color={tone.icon} />
      </View>
      <View style={styles.body}>
        <View style={styles.texts}>
          <AppText weight="semibold" color={tone.text}>
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
      {opens && <Icon name="forward" size={20} color={Colors.textSecondary} />}
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
