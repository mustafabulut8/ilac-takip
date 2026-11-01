import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { doseLogId } from '@/lib/doses';
import { scheduleMedication, syncNotifications } from '@/lib/notifications';
import { savePhoto } from '@/lib/photos';
import { loadDoseLogs, loadMedications, saveDoseConfirmation, saveMedications } from '@/lib/storage';
import type { DoseLog, Medication } from '@/types';

export type NewMedication = Pick<Medication, 'name' | 'dose' | 'times' | 'stock'> & {
  photoSourceUri: string;
};

type MedicationsContextValue = {
  isLoaded: boolean;
  medications: Medication[];
  doseLogs: DoseLog[];
  addMedication: (input: NewMedication) => Promise<void>;
  confirmDose: (medicationId: string, date: string, time: string) => Promise<void>;
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
        // Örneğin izin sonradan verildiyse eksik hatırlatmalar burada tamamlanır.
        syncNotifications(storedMedications).catch(() => {});
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

  const confirmDose = async (medicationId: string, date: string, time: string) => {
    const id = doseLogId(medicationId, date, time);
    if (doseLogs.some((log) => log.id === id)) return;

    const updatedLogs = [
      ...doseLogs,
      { id, medicationId, date, time, takenAt: new Date().toISOString() },
    ];
    const updatedMedications = medications.map((medication) =>
      medication.id === medicationId
        ? { ...medication, stock: Math.max(medication.stock - 1, 0) }
        : medication,
    );
    await saveDoseConfirmation(updatedMedications, updatedLogs);
    setDoseLogs(updatedLogs);
    setMedications(updatedMedications);
  };

  return (
    <MedicationsContext.Provider
      value={{ isLoaded, medications, doseLogs, addMedication, confirmDose }}>
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
