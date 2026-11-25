import { Modal, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { FieldError } from './form/field-error';
import { Icon, type IconName } from './icon';
import { PrimaryButton } from './primary-button';
import { SecondaryButton } from './secondary-button';

type ConfirmDialogProps = {
  visible: boolean;
  icon: IconName;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** İşlem sürerken düğmeler basılamaz. */
  busy?: boolean;
  error?: string | null;
};

/**
 * Ortada açılan onay penceresi (Stitch 20, Çıkış onayı). "Vazgeç" 2px turkuaz
 * çerçevelidir; arka plan karartılır.
 */
export function ConfirmDialog({
  visible,
  icon,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.iconCircle}>
            <Icon name={icon} size={32} color={Colors.primary} />
          </View>
          <AppText size="heading" weight="bold" center accessibilityRole="header">
            {title}
          </AppText>
          <AppText center color={Colors.textSecondary}>
            {message}
          </AppText>
          <FieldError message={error} />
          <View style={styles.actions}>
            <PrimaryButton label={confirmLabel} onPress={onConfirm} disabled={busy} />
            <SecondaryButton label="Vazgeç" onPress={onCancel} disabled={busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: 24,
    backgroundColor: Colors.card,
  },
  iconCircle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentSoft,
  },
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
});
