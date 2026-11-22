import { StyleSheet, TextInput, View } from 'react-native';

import { Colors, FontFamily, FontSize, MinButtonHeight, Radius, Spacing } from '@/constants/theme';
import { AppText } from '@/components/app-text';

import { FieldError } from './field-error';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
};

/** Büyük yazılı, hatalıysa kalın kırmızı çerçeveli metin kutusu. */
export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <AppText weight="bold">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        style={[styles.input, !!error && styles.inputInvalid]}
        placeholderTextColor={Colors.textSecondary}
        maxLength={60}
        {...inputProps}
      />
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  input: {
    minHeight: MinButtonHeight,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.three,
    color: Colors.text,
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
  },
  inputInvalid: {
    borderColor: Colors.danger,
    borderWidth: 3,
  },
});
