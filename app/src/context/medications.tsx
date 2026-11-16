import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { logger } from '@/utils/logger';
import { doseLogId } from '@/lib/doses';
import { scheduleMedication, syncNotifications } from '@/lib/notifications';
import { savePhoto } from '@/lib/photos';
import { userMessageOf } from '@/errors';
import { storage } from '@/services';
import { DEFAULT_FORM_KIND, type DoseLog, type Medication, type NewMedication } from '@/models';

type MedicationsContextValue = {
  isLoaded: boolean;
  medications: Medication[];
  doseLogs: DoseLog[];
  addMedication: (input: NewMedication) => Promise<void>;
  confirmDose: (medicationId: string, date: string, time: string) => Promise<void>;
  /** Ana ekranda kısa süre gösterilen mesaj. */
  notice: string | null;
  clearNotice: () => void;
  /** Kayıtlı veri okunurken çıkan sorunlar; ana ekranda uyarı olarak gösterilir. */
  storageWarnings: string[];
};

const MedicationsContext = createContext<MedicationsContextValue | null>(null);

export function MedicationsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [storageWarnings, setStorageWarnings] = useState<string[]>([]);

  useEffect(() => {
    storage
      .load()
      .then(({ medications: storedMedications, doseLogs: storedLogs, warnings }) => {
        setMedications(storedMedications);
        setDoseLogs(storedLogs);
        setStorageWarnings(warnings);
        // Örneğin izin sonradan verildiyse eksik hatırlatmalar burada tamamlanır.
        syncNotifications(storedMedications).catch((error) => {
          logger.error('Bildirimler eşitlenemedi:', error);
        });
      })
      .catch((error) => {
        logger.error('Kayıtlı veriler okunamadı:', error);
        setStorageWarnings([
          userMessageOf(error, 'Kayıtlı veriler okunamadı. Lütfen uygulamayı yeniden açın.'),
        ]);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const addMedication = async ({
    photoSourceUri,
    form = DEFAULT_FORM_KIND,
    ...input
  }: NewMedication) => {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    let photoFile: string;
    try {
      photoFile = await savePhoto(photoSourceUri, id);
    } catch (error) {
      logger.error('Fotoğraf kopyalanamadı:', error);
      throw new Error('Fotoğraf kaydedilemedi. Lütfen fotoğrafı yeniden seçip tekrar deneyin.');
    }

    const medication: Medication = {
      ...input,
      form,
      id,
      photoFile,
      createdAt: new Date().toISOString(),
    };
    const updated = [...medications, medication];
    try {
      await storage.saveMedications(updated);
    } catch (error) {
      logger.error('İlaç AsyncStorage’a yazılamadı:', error);
      throw new Error(
        userMessageOf(error, 'İlaç bilgileri telefona kaydedilemedi. Lütfen tekrar deneyin.'),
      );
    }
    setMedications(updated);

    // Bildirim planlanamasa da ilaç kaydı korunur, ama kullanıcı bunu öğrenir.
    try {
      await scheduleMedication(medication);
      setNotice('İlaç kaydedildi');
    } catch (error) {
      logger.error('Bildirim planlanamadı:', error);
      setNotice('İlaç kaydedildi, ancak hatırlatma kurulamadı. Bildirim iznini kontrol edin.');
    }
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
    await storage.saveDoseConfirmation(updatedMedications, updatedLogs);
    setDoseLogs(updatedLogs);
    setMedications(updatedMedications);
  };

  return (
    <MedicationsContext.Provider
      value={{
        isLoaded,
        medications,
        doseLogs,
        addMedication,
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
