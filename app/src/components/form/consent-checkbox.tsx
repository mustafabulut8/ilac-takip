import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { Colors, MinTouchSize, Spacing } from '@/constants/theme';

import { TextLink } from '../text-link';

import { FieldError } from './field-error';

type ConsentCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  /** Aydınlatma metnini açar. */
  onOpenText: () => void;
  error?: string;
};

/**
 * KVKK onay kutusu. Metnin bağlantısı cümlenin içinde değil, altında ayrı bir 48pt
 * dokunma alanıdır; satır içi bağlantı yaşlı kullanıcı için çok küçük kalıyordu.
 */
export function ConsentCheckbox({ checked, onToggle, onOpenText, error }: ConsentCheckboxProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel="Kişisel verilerimin işlenmesine ilişkin aydınlatma metnini okudum ve kabul ediyorum"
          onPress={onToggle}
          hitSlop={8}
          style={[styles.box, checked && styles.boxChecked, !!error && styles.boxInvalid]}>
          {checked && <Icon name="check" size={22} color={Colors.textOnColor} />}
        </Pressable>
        <AppText style={styles.text} onPress={onToggle} color={Colors.textSecondary}>
          Kişisel verilerimin işlenmesine ilişkin aydınlatma metnini okudum ve kabul ediyorum.
        </AppText>
      </View>
      <TextLink label="KVKK Aydınlatma Metni" onPress={onOpenText} align="flex-start" />
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  row: {
    minHeight: MinTouchSize,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  box: {
    width: 32,
    height: 32,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  boxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  boxInvalid: {
    borderColor: Colors.danger,
    borderWidth: 3,
  },
  text: {
    flex: 1,
  },
});
