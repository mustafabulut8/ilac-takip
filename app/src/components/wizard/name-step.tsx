import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Chip, ChipGroup } from '@/components/chip-group';
import { TextField } from '@/components/form/text-field';
import { useMedicationPhoto } from '@/hooks/useMedicationPhoto';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';

import { DraftPhoto } from './draft-photo';
import { StepTitle } from './step-title';

const QUICK_NAMES = ['Tansiyon ilacı', 'Şeker ilacı', 'Mide koruyucu', 'Kolesterol ilacı'];

export function NameStep({ wizard }: { wizard: MedicationWizard }) {
  const { draft, update } = wizard;
  const savedUri = useMedicationPhoto(draft.photoFile, draft.photoPath);

  return (
    <>
      <StepTitle title="İlacın adı nedir?" />
      {(draft.photo ?? savedUri) && (
        <Card>
          <AppText weight="bold">Kutunun üzerindeki adı kontrol edin</AppText>
          <DraftPhoto draft={draft} height={180} />
        </Card>
      )}
      <TextField
        label="İlaç ismi (zorunlu)"
        value={draft.name}
        onChangeText={(name) => update({ name })}
        placeholder="Örn. Tansiyon ilacı"
      />
      <AppText weight="bold">Hızlı seçenekler</AppText>
      <ChipGroup>
        {QUICK_NAMES.map((name) => (
          <Chip
            key={name}
            label={name}
            selected={draft.name === name}
            onPress={() => update({ name })}
          />
        ))}
      </ChipGroup>
    </>
  );
}
