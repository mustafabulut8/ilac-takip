import { OptionCard } from '@/components/option-card';
import type { IconName } from '@/components/icon';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';
import { MEAL_TIMING_LABELS, type MealTiming } from '@/models';

import { StepTitle } from './step-title';

const OPTIONS: { value: MealTiming; label: string; detail?: string; icon: IconName }[] = [
  { value: 'empty', label: MEAL_TIMING_LABELS.empty, detail: 'Yemekten önce', icon: 'clock' },
  { value: 'full', label: MEAL_TIMING_LABELS.full, detail: 'Yemekten sonra', icon: 'meal' },
  { value: 'any', label: 'Fark etmez', detail: MEAL_TIMING_LABELS.any, icon: 'check' },
];

export function MealStep({ wizard }: { wizard: MedicationWizard }) {
  const { draft, update } = wizard;
  return (
    <>
      <StepTitle title="Aç mı, tok mu alınacak?" />
      {OPTIONS.map(({ value, ...option }) => (
        <OptionCard
          key={value}
          {...option}
          selected={draft.mealTiming === value}
          onPress={() => update({ mealTiming: value })}
        />
      ))}
    </>
  );
}
