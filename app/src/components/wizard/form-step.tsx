import { StyleSheet, View } from 'react-native';

import { OptionCard } from '@/components/option-card';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';
import { allMedicationForms } from '@/models';

import { StepTitle } from './step-title';

export function FormStep({ wizard }: { wizard: MedicationWizard }) {
  const { draft, selectForm } = wizard;
  return (
    <>
      <StepTitle title="İlaç ne şekilde?" detail="İlacınıza uyan kutuyu seçin." />
      <View style={styles.grid} accessibilityRole="radiogroup">
        {allMedicationForms().map(({ kind, label }) => (
          <OptionCard
            key={kind}
            vertical
            label={label}
            icon={kind}
            selected={draft.form === kind}
            onPress={() => selectForm(kind)}
            style={styles.cell}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    flexGrow: 1,
    flexBasis: '45%',
  },
});
