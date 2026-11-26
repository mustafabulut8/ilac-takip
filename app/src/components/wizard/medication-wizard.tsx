import { router } from 'expo-router';
import { useEffect, type ComponentType } from 'react';
import { Alert, BackHandler } from 'react-native';

import {
  useMedicationWizard,
  type MedicationWizard,
  type WizardStepId,
} from '@/hooks/useMedicationWizard';
import type { Medication } from '@/models';

import { DoseStep } from './dose-step';
import { FormStep } from './form-step';
import { MealStep } from './meal-step';
import { NameStep } from './name-step';
import { PhotoStep } from './photo-step';
import { ScheduleStep } from './schedule-step';
import { StockStep } from './stock-step';
import { SummaryStep } from './summary-step';
import { TimesStep } from './times-step';
import { WizardStepLayout } from './step-layout';

const STEPS: Record<WizardStepId, ComponentType<{ wizard: MedicationWizard }>> = {
  photo: PhotoStep,
  name: NameStep,
  form: FormStep,
  dose: DoseStep,
  schedule: ScheduleStep,
  times: TimesStep,
  meal: MealStep,
  stock: StockStep,
  summary: SummaryStep,
};

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** İlaç ekleme ve (ilaç verilirse) düzenleme sihirbazı. */
export function MedicationWizardScreen({ medication }: { medication?: Medication }) {
  const wizard = useMedicationWizard(medication);
  const { step, back, next, save, isDirty, isSaving } = wizard;
  const Step = STEPS[step.id];

  const goBack = () => {
    if (isSaving || back()) return;
    if (!isDirty) {
      leave();
      return;
    }
    Alert.alert('Çıkılsın mı?', 'Girdiğiniz bilgiler kaydedilmeyecek.', [
      { text: 'Devam et', style: 'cancel' },
      { text: 'Çık', style: 'destructive', onPress: leave },
    ]);
  };

  const onPrimary = async () => {
    if (step.id !== 'summary') next();
    else if (await save()) leave();
  };

  // Android geri tuşu ekranı kapatmak yerine önceki adıma döner.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  });

  return (
    <WizardStepLayout
      wizard={wizard}
      title={medication ? 'İlacı düzenle' : 'İlaç ekle'}
      onBack={goBack}
      onPrimary={onPrimary}
      primaryLabel={step.id !== 'summary' ? 'Devam' : isSaving ? 'Kaydediliyor…' : 'Kaydet'}>
      <Step key={step.id} wizard={wizard} />
    </WizardStepLayout>
  );
}
