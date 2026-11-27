import { type ReactNode, useMemo } from 'react';

import { familyServicesFor } from '@/services';

import { CareSubjectProvider } from './care-subject';
import { MedicationsProvider } from './medications';

/**
 * Aile üyesinin yakını için ekranlar (ilaçları yönet, ekle, düzenle). Mevcut
 * `MedicationsProvider` bu kişinin sunucudaki listesiyle kurulur; hatırlatıcı boştur,
 * yani aile telefonu yakının hatırlatmalarını kurmaz.
 */
export function FamilyMemberProvider({
  patientId,
  name,
  children,
}: {
  patientId: string;
  name: string;
  children: ReactNode;
}) {
  const services = useMemo(() => familyServicesFor(patientId), [patientId]);
  const subject = useMemo(() => ({ patientId, name }), [patientId, name]);
  return (
    <CareSubjectProvider subject={subject}>
      <MedicationsProvider services={services}>{children}</MedicationsProvider>
    </CareSubjectProvider>
  );
}
