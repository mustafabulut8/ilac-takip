import { useState } from 'react';

import { AppText } from '@/components/app-text';
import { Banner } from '@/components/banner';
import { Card } from '@/components/card';
import { Chip, ChipGroup } from '@/components/chip-group';
import { TextField } from '@/components/form/text-field';
import { NumberStepper } from '@/components/number-stepper';
import { OptionCard } from '@/components/option-card';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';
import { formatAmount, getMedicationForm, type DoseInput } from '@/models';

import { StepTitle } from './step-title';

/** Hazır miktarların altındaki kısa açıklama. */
const PRESET_DETAILS: Record<number, string> = {
  0.5: '0,5 doz miktarı',
  1: 'Tek doz',
  2: 'Çift doz',
};

/** Dozaj adımı formun kendi seçeneklerinden kurulur; burada forma göre if/switch yoktur. */
export function DoseStep({ wizard }: { wizard: MedicationWizard }) {
  const { draft, update } = wizard;
  const form = getMedicationForm(draft.form);
  const { dose, keptDose } = draft;
  const presets = form.presetAmounts();
  const [showsStepper, setShowsStepper] = useState(
    presets.length === 0 || !presets.includes(dose.amount),
  );

  const setDose = (changes: Partial<DoseInput>) =>
    update({ dose: { ...dose, ...changes }, keptDose: null });

  return (
    <>
      <StepTitle title="Bir seferde ne kadar?" />
      {keptDose !== null && (
        <Banner
          tone="info"
          icon="info"
          title={`Kayıtlı doz: ${keptDose}`}
          detail="Aşağıdan yeni bir miktar seçmezseniz aynı kalır."
        />
      )}

      {form.hasFreeTextDose() && (
        <TextField
          label="Doz"
          value={keptDose ?? dose.text}
          onChangeText={(text) => setDose({ text })}
          placeholder="Örn. Bir kapak"
        />
      )}

      {presets.map((amount) => (
        <OptionCard
          key={amount}
          label={`${formatAmount(amount)} ${form.unitName(dose.unit)}`}
          detail={PRESET_DETAILS[amount]}
          selected={keptDose === null && !showsStepper && dose.amount === amount}
          onPress={() => {
            setShowsStepper(false);
            setDose({ amount });
          }}
        />
      ))}
      {presets.length > 0 && (
        <OptionCard
          label="Diğer miktar"
          selected={keptDose === null && showsStepper}
          onPress={() => {
            setShowsStepper(true);
            setDose({});
          }}
        />
      )}

      {form.doseUnits().length > 1 && (
        <>
          <AppText weight="bold">Ölçü birimi</AppText>
          <ChipGroup>
            {form.doseUnits().map((unit) => (
              <Chip
                key={unit}
                label={unit}
                selected={dose.unit === unit}
                onPress={() => setDose({ unit })}
              />
            ))}
          </ChipGroup>
        </>
      )}

      {form.hasAmount() && showsStepper && (
        <Card>
          <NumberStepper
            value={dose.amount}
            unit={form.unitName(dose.unit)}
            onChange={(amount) => setDose({ amount })}
            {...form.amountRange()}
          />
        </Card>
      )}

      {!form.hasAmount() && !form.hasFreeTextDose() && (
        <Banner
          tone="info"
          icon="info"
          title="İnce tabaka"
          detail="Bu ilaç için miktar sayıyla girilmez."
        />
      )}

      {form.locations().length > 0 && (
        <>
          <AppText weight="bold">Uygulama bölgesi</AppText>
          <ChipGroup>
            {form.locations().map((location) => (
              <Chip
                key={location}
                label={location}
                selected={dose.location === location}
                onPress={() => setDose({ location: dose.location === location ? '' : location })}
              />
            ))}
          </ChipGroup>
        </>
      )}
      {form.hasFreeTextLocation() && (
        <TextField
          label="Uygulama bölgesi (isteğe bağlı)"
          value={dose.location}
          onChangeText={(location) => setDose({ location })}
          placeholder="Örn. Sol kol"
        />
      )}
    </>
  );
}
