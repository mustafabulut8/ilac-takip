import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import type { UserRole } from '@/models';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type RoleOptionContent = {
  label: string;
  detail: string;
  /** Dairedeki simge: yazı ("Aa") veya ikon. */
  symbol: { text: string } | { icon: IconName };
  /** Kartta rozet olarak gösterilen öneri; yoksa rozet çıkmaz. */
  recommendation?: string;
};

/**
 * Rol seçimi kartlarının içeriği (Stitch 09). Açık/kapalı ilkesi: yeni rol bu tabloya
 * bir satır eklenerek tanıtılır; kart bileşeni role göre dallanmaz.
 */
export const ROLE_OPTIONS: Record<UserRole, RoleOptionContent> = {
  sade: {
    label: 'Sade kullanım',
    detail: 'Büyük yazılar, tek dokunuşla onay. İlaçlarımı yakınım ekler.',
    symbol: { text: 'Aa' },
    recommendation: 'İleri yaş için önerilir',
  },
  standart: {
    label: 'Standart kullanım',
    detail: 'İlaçlarımı kendim ekler ve takip ederim.',
    symbol: { icon: 'pills' },
  },
  aile: {
    label: 'Yakınımı takip etmek istiyorum',
    detail: 'Yakınımın ilaçlarını eklerim, kaçırılan dozlardan haberdar olurum.',
    symbol: { icon: 'family' },
  },
};

function RoleSymbol({ symbol }: Pick<RoleOptionContent, 'symbol'>) {
  if ('text' in symbol) {
    return (
      <AppText size="heading" weight="bold" color={Colors.primary}>
        {symbol.text}
      </AppText>
    );
  }
  return <Icon name={symbol.icon} size={26} color={Colors.primary} />;
}

type RoleOptionProps = {
  role: UserRole;
  selected: boolean;
  onPress: () => void;
};

/**
 * Rol kartı. Seçili kart #E6F2F2 zeminli ve 2px turkuaz çerçevelidir; rozet ve
 * "Aa" dairesi beyaz zeminli, 1px turkuaz çerçevelidir ki seçili zeminde de görünsün.
 */
export function RoleOption({ role, selected, onPress }: RoleOptionProps) {
  const { label, detail, symbol, recommendation } = ROLE_OPTIONS[role];
  const spoken = [label, recommendation?.toLocaleLowerCase('tr-TR'), detail].filter(Boolean);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={spoken.join(', ')}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.circle}>
        <RoleSymbol symbol={symbol} />
      </View>
      <View style={styles.texts}>
        <AppText weight="bold">{label}</AppText>
        {recommendation && (
          <View style={styles.badge}>
            <AppText size="small" weight="semibold" color={Colors.primary}>
              {recommendation}
            </AppText>
          </View>
        )}
        <AppText size="small" color={Colors.textSecondary}>
          {detail}
        </AppText>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Icon name="check" size={18} color={Colors.textOnColor} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.card,
    backgroundColor: Colors.card,
    boxShadow: Shadow.card,
  },
  selected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.selectedSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  circle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  texts: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  radio: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.neutralStrong,
  },
  radioSelected: {
    backgroundColor: Colors.primary,
  },
});
