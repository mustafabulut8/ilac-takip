import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { usePhotoPicker } from '@/hooks/usePhotoPicker';
import type { MedicationWizard } from '@/hooks/useMedicationWizard';

import { DraftPhoto } from './draft-photo';
import { StepTitle } from './step-title';

export function PhotoStep({ wizard }: { wizard: MedicationWizard }) {
  const { draft, choosePhoto, skipPhoto, setError } = wizard;
  const { takePhoto, pickPhoto } = usePhotoPicker({ onPicked: choosePhoto, onError: setError });

  return (
    <>
      <StepTitle title="İlacın kutusunun fotoğrafını çekin" />
      <DraftPhoto draft={draft} height={220} />
      <PrimaryButton label="Fotoğraf çek" icon="camera" onPress={takePhoto} />
      <SecondaryButton label="Galeriden seç" icon="gallery" onPress={pickPhoto} />
      <SecondaryButton
        label={draft.photo || draft.photoFile ? 'Fotoğrafı kaldır' : 'Fotoğrafsız devam et'}
        variant="neutral"
        compact
        onPress={skipPhoto}
      />
    </>
  );
}
