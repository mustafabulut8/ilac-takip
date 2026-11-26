import type { ReactNode } from 'react';

import { MedicationsProvider } from '@/context/medications';
import type { DoseLog, Medication } from '@/models';
import { DoseCalculator } from '@/services/DoseCalculator';
import { DoseService } from '@/services/DoseService';
import type { Clock } from '@/services/ports';

import { FakeStorage } from './fakes';

/**
 * Kanca ve ekran testleri için gerçek doz onayı ve sahte depoyla kurulmuş sağlayıcı.
 * İlaç ekleme, güncelleme ve silme sahte fonksiyonlardır; testler çağrıları denetler.
 */
export function makeMedicationsHarness(
  medications: Medication[],
  { doseLogs = [], now }: { doseLogs?: DoseLog[]; now: Clock },
) {
  const storage = new FakeStorage();
  storage.medications = medications;
  storage.doseLogs = doseLogs;
  const snoozes = { cancelSnooze: jest.fn().mockResolvedValue(undefined) };
  const services = {
    medications: {
      load: () => storage.load(),
      add: jest.fn().mockResolvedValue({ medications, notice: 'İlaç kaydedildi' }),
      update: jest.fn().mockResolvedValue({ medications, notice: 'Değişiklik kaydedildi' }),
      remove: jest.fn().mockResolvedValue({ medications: [], notice: 'İlaç silindi' }),
    },
    doses: new DoseService(storage.doseLogRepository, snoozes, new DoseCalculator(), now),
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MedicationsProvider services={services}>{children}</MedicationsProvider>
  );
  return { storage, services, snoozes, wrapper };
}
