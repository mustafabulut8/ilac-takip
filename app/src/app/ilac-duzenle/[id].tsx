import { useLocalSearchParams } from 'expo-router';

import { NotFoundMessage } from '@/components/not-found-message';
import { MedicationWizardScreen } from '@/components/wizard/medication-wizard';
import { useMedications } from '@/hooks/useMedications';

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoaded, medications } = useMedications();
  const medication = medications.find((item) => item.id === id);

  if (!isLoaded) return null;
  if (!medication) return <NotFoundMessage />;
  return <MedicationWizardScreen medication={medication} />;
}
