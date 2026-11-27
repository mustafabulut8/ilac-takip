import { NeedsInternet } from '@/components/needs-internet';
import { MedicationWizardScreen } from '@/components/wizard/medication-wizard';
import { useOnline } from '@/hooks/useOnline';

/** Yakın için ilaç ekleme: aynı sihirbaz, başlıkta "<ad> için". */
export default function FamilyAddMedicationScreen() {
  const online = useOnline();
  if (!online) return <NeedsInternet />;
  return <MedicationWizardScreen />;
}
