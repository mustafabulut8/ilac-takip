import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { Colors, MinTouchSize, Spacing } from '@/constants/theme';

import { FieldError } from './field-error';

type ConsentCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  /** Aydınlatma metnini açar. */
  onOpenText: () => void;
  error?: string;
};

/** KVKK onay kutusu; metnin bağlantısı ayrı bir dokunma alanıdır. */
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
          Kişisel verilerimin işlenmesine ilişkin{' '}
          <AppText
            weight="bold"
            color={Colors.primary}
            style={styles.link}
            accessibilityRole="link"
            onPress={onOpenText}>
            KVKK Aydınlatma Metni
          </AppText>
          ’ni okudum ve kabul ediyorum.
        </AppText>
      </View>
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
  link: {
    textDecorationLine: 'underline',
  },
});
