import { StyleSheet, TextInput, type KeyboardTypeOptions } from 'react-native';

import { Colors, FontSize, MinButtonHeight, Spacing } from '@/constants/theme';

import { FormField } from './form-field';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  onLayoutY?: (y: number) => void;
};

/** Büyük yazılı, hatalıysa kalın kırmızı çerçeveli metin kutusu. */
export function TextField({ label, error, onLayoutY, ...inputProps }: TextFieldProps) {
  return (
    <FormField label={label} error={error} onLayoutY={onLayoutY}>
      <TextInput
        style={[styles.input, !!error && styles.inputInvalid]}
        placeholderTextColor={Colors.textSecondary}
        {...inputProps}
      />
    </FormField>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: MinButtonHeight,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: Colors.text,
    fontSize: FontSize.body,
  },
  inputInvalid: {
    borderColor: Colors.danger,
    borderWidth: 3,
  },
});
