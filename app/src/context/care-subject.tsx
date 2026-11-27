import { createContext, type ReactNode, useContext } from 'react';

/** Aile üyesinin o an ilgilendiği yakın; aile ekranlarının dışında `null`. */
export type CareSubject = { patientId: string; name: string };

const CareSubjectContext = createContext<CareSubject | null>(null);

/**
 * Sihirbaz ve ilaç listesi bu bağlamdan kimin için çalıştığını öğrenir: başlıkta
 * "<ad> için" yazılır, düzenleme rotası yakının altına gider. Veri ise kişiye özel
 * `MedicationsProvider`'dan gelir (aile/[kisiId]/_layout.tsx).
 */
export function CareSubjectProvider({
  subject,
  children,
}: {
  subject: CareSubject;
  children: ReactNode;
}) {
  return <CareSubjectContext.Provider value={subject}>{children}</CareSubjectContext.Provider>;
}

export function useCareSubject() {
  return useContext(CareSubjectContext);
}
