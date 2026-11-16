import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Spacing } from '@/constants/theme';

import { FieldError } from './field-error';

type FormFieldProps = {
  label: string;
  error?: string;
  /** Alanın kaydırma alanındaki dikey konumu; ilk hatalı alana kaydırmak için. */
  onLayoutY?: (y: number) => void;
  children: ReactNode;
};

/** Başlık, içerik ve hata metninden oluşan form satırı. */
export function FormField({ label, error, onLayoutY, children }: FormFieldProps) {
  return (
    <View style={styles.field} onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}>
      <Text style={styles.label}>{label}</Text>
      {children}
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  label: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
});
