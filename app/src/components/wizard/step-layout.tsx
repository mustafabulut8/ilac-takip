import { type ReactNode, useEffect, useRef, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { FieldError } from '@/components/form/field-error';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { SecondaryButton } from '@/components/secondary-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';

type WizardStepLayoutProps = {
  wizard: MedicationWizard;
  title: string;
  onBack: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  children: ReactNode;
};

/** Sihirbazın ortak iskeleti: başlık, "Adım X / 9", ilerleme çubuğu, Geri ve Devam. */
export function WizardStepLayout({
  wizard,
  title,
  onBack,
  onPrimary,
  primaryLabel,
  children,
}: WizardStepLayoutProps) {
  const insets = useSafeAreaInsets();
  const scrollView = useRef<ComponentRef<typeof ScrollView>>(null);
  const { step, stepNumber, stepCount, error, isSaving, canContinue } = wizard;

  // Yeni adım her zaman en üstten okunmaya başlanır.
  useEffect(() => {
    scrollView.current?.scrollTo({ y: 0, animated: false });
  }, [stepNumber]);

  return (
    <View style={styles.container}>
      <ScreenHeader title={title} onBack={onBack} />
      <View style={styles.progress}>
        <View style={styles.progressTexts}>
          <AppText weight="bold" color={Colors.primary}>
            Adım {stepNumber} / {stepCount}
          </AppText>
          <AppText size="small" color={Colors.textSecondary}>
            {step.label}
          </AppText>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(stepNumber / stepCount) * 100}%` }]} />
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollView}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {children}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
          <FieldError message={error} />
          <View style={styles.buttons}>
            <SecondaryButton
              label="Geri"
              variant="neutral"
              icon="back"
              onPress={onBack}
              style={styles.backButton}
            />
            <PrimaryButton
              label={primaryLabel}
              icon={step.id === 'summary' ? 'check' : 'arrowRight'}
              // Eksik adımda da basılabilir; basınca neyin eksik olduğu yazılır.
              onPress={onPrimary}
              disabled={isSaving}
              accessibilityLabel={canContinue ? primaryLabel : `${primaryLabel}, adım eksik`}
              style={styles.flex}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  progress: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.three,
  },
  progressTexts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  track: {
    height: 12,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: Colors.neutralStrong,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.screen,
    paddingTop: Spacing.two,
  },
  footer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    minWidth: '32%',
  },
});
