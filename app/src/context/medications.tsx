import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { userMessageOf } from '@/errors';
import type { DoseLog, Medication, NewMedication } from '@/models';
import {
  doseService as defaultDoseService,
  medicationService as defaultMedicationService,
  type DoseService,
  type MedicationChanges,
  type MedicationService,
} from '@/services';
import { logger } from '@/utils/logger';

/** Sağlayıcıya verilebilen servisler; testte sahteleri verilebilir. */
export type MedicationsServices = {
  medications: MedicationService;
  doses: DoseService;
};

type MedicationsContextValue = {
  isLoaded: boolean;
  medications: Medication[];
  doseLogs: DoseLog[];
  addMedication: (input: NewMedication) => Promise<void>;
  updateMedication: (id: string, changes: MedicationChanges) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  confirmDose: (medicationId: string, date: string, time: string) => Promise<void>;
  /** Ana ekranda kısa süre gösterilen mesaj. */
  notice: string | null;
  clearNotice: () => void;
  /** Kayıtlı veri okunurken çıkan sorunlar; ana ekranda uyarı olarak gösterilir. */
  storageWarnings: string[];
};

const MedicationsContext = createContext<MedicationsContextValue | null>(null);

const DEFAULT_SERVICES: MedicationsServices = {
  medications: defaultMedicationService,
  doses: defaultDoseService,
};

/**
 * Uygulama verisinin React durumu. İş kuralı burada değil servislerdedir;
 * bu bileşen yalnızca servisleri çağırıp sonucu duruma yazar.
 */
export function MedicationsProvider({
  children,
  services = DEFAULT_SERVICES,
}: {
  children: ReactNode;
  services?: MedicationsServices;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [storageWarnings, setStorageWarnings] = useState<string[]>([]);

  useEffect(() => {
    services.medications
      .load()
      .then((data) => {
        setMedications(data.medications);
        setDoseLogs(data.doseLogs);
        setStorageWarnings(data.warnings);
      })
      .catch((error) => {
        // Sessizce boş liste gösterilmez; kullanıcı verinin okunamadığını öğrenir.
        logger.error('Kayıtlı veriler okunamadı:', error);
        setStorageWarnings([
          userMessageOf(error, 'Kayıtlı veriler okunamadı. Lütfen uygulamayı yeniden açın.'),
        ]);
      })
      .finally(() => setIsLoaded(true));
  }, [services]);

  const addMedication = async (input: NewMedication) => {
    const result = await services.medications.add(medications, input);
    setMedications(result.medications);
    setNotice(result.notice);
  };

  const updateMedication = async (id: string, changes: MedicationChanges) => {
    setMedications(await services.medications.update(medications, id, changes));
  };

  const removeMedication = async (id: string) => {
    setMedications(await services.medications.remove(medications, id));
  };

  const confirmDose = async (medicationId: string, date: string, time: string) => {
    const next = await services.doses.confirmDose(
      { medications, doseLogs },
      medicationId,
      date,
      time,
    );
    if (!next) return;
    setDoseLogs(next.doseLogs);
    setMedications(next.medications);
  };

  return (
    <MedicationsContext.Provider
      value={{
        isLoaded,
        medications,
        doseLogs,
        addMedication,
        updateMedication,
        removeMedication,
        confirmDose,
        notice,
        clearNotice: () => setNotice(null),
        storageWarnings,
      }}>
      {children}
    </MedicationsContext.Provider>
  );
}

export function useMedications() {
  const value = useContext(MedicationsContext);
  if (!value) {
    throw new Error('useMedications, MedicationsProvider içinde kullanılmalıdır.');
  }
  return value;
}
