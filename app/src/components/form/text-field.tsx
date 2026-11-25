import type { ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { Colors, FontFamily, FontSize, MinButtonHeight, Radius, Spacing } from '@/constants/theme';
import { AppText } from '@/components/app-text';

import { FieldError } from './field-error';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  /** Etiketin yanındaki küçük not ("Gerekli" gibi). */
  hint?: string;
  /** Kutunun sağındaki düğme (şifreyi göster gibi). */
  trailing?: ReactNode;
  /** Klavye türü, otomatik doldurma, gizli yazı gibi ek ayarlar. */
  inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'style'>;
};

/** Büyük yazılı, hatalıysa kalın kırmızı çerçeveli metin kutusu. */
export function TextField({
  label,
  error,
  hint,
  trailing,
  inputProps,
  ...valueProps
}: TextFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <AppText weight="bold">{label}</AppText>
        {hint && (
          <AppText size="small" color={Colors.textSecondary}>
            {hint}
          </AppText>
        )}
      </View>
      <View style={[styles.box, !!error && styles.boxInvalid]}>
        <TextInput
          accessibilityLabel={label}
          style={styles.input}
          placeholderTextColor={Colors.textSecondary}
          maxLength={60}
          {...inputProps}
          {...valueProps}
        />
        {trailing}
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  box: {
    minHeight: MinButtonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: Radius.button,
  },
  boxInvalid: {
    borderColor: Colors.danger,
    borderWidth: 3,
  },
  input: {
    flex: 1,
    minHeight: MinButtonHeight,
    paddingHorizontal: Spacing.three,
    color: Colors.text,
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
  },
});
