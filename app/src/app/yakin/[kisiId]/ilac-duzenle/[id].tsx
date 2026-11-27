import EditMedicationScreen from '@/app/ilac-duzenle/[id]';
import { NeedsInternet } from '@/components/needs-internet';
import { useOnline } from '@/hooks/useOnline';

/** Yakının ilacını düzenleme: aynı sihirbaz, yalnızca çevrimiçiyken. */
export default function FamilyEditMedicationScreen() {
  const online = useOnline();
  if (!online) return <NeedsInternet />;
  return <EditMedicationScreen />;
}
