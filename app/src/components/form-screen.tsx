import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { IconButton } from './icon-button';

type FormScreenProps = {
  title: string;
  subtitle?: string;
  /** Geri düğmesi gösterilsin mi? Gidecek ekran yoksa gösterilmez. */
  canGoBack?: boolean;
  children: ReactNode;
};

/** Giriş, kayıt ve benzeri form ekranlarının iskeleti; klavye açılınca içerik kayar. */
export function FormScreen({ title, subtitle, canGoBack = true, children }: FormScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.five },
        ]}>
        {canGoBack && router.canGoBack() && (
          <IconButton
            icon="back"
            accessibilityLabel="Geri"
            color={Colors.primary}
            background={Colors.card}
            onPress={() => router.back()}
          />
        )}
        <View style={styles.header}>
          <AppText size="title" weight="bold" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle && <AppText color={Colors.textSecondary}>{subtitle}</AppText>}
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.screen,
  },
  header: {
    gap: Spacing.two,
  },
});
