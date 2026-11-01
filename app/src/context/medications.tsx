import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { scheduleMedication } from '@/lib/notifications';
import { savePhoto } from '@/lib/photos';
import { loadDoseLogs, loadMedications, saveMedications } from '@/lib/storage';
import type { DoseLog, Medication } from '@/types';

export type NewMedication = Pick<Medication, 'name' | 'dose' | 'times' | 'stock'> & {
  photoSourceUri: string;
};

type MedicationsContextValue = {
  isLoaded: boolean;
  medications: Medication[];
  doseLogs: DoseLog[];
  addMedication: (input: NewMedication) => Promise<void>;
};

const MedicationsContext = createContext<MedicationsContextValue | null>(null);

export function MedicationsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);

  useEffect(() => {
    Promise.all([loadMedications(), loadDoseLogs()])
      .then(([storedMedications, storedLogs]) => {
        setMedications(storedMedications);
        setDoseLogs(storedLogs);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const addMedication = async ({ photoSourceUri, ...input }: NewMedication) => {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const photoFile = await savePhoto(photoSourceUri, id);
    const medication: Medication = { ...input, id, photoFile, createdAt: new Date().toISOString() };

    const updated = [...medications, medication];
    await saveMedications(updated);
    setMedications(updated);

    // Bildirim planlanamasa da ilaç kaydı korunur; izin ana ekranda istenir.
    await scheduleMedication(medication).catch(() => {});
  };

  return (
    <MedicationsContext.Provider value={{ isLoaded, medications, doseLogs, addMedication }}>
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
