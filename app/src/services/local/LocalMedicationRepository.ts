import type { Medication } from '@/models';

import type { Loaded, MedicationRepository } from '../repositories';
import type { LocalDeviceStore } from './LocalDeviceStore';

/** İlaçlar cihazda, `medications` anahtarında (anahtar ve alan adları değişmez). */
export class LocalMedicationRepository implements MedicationRepository {
  private readonly device: LocalDeviceStore;

  constructor(device: LocalDeviceStore) {
    this.device = device;
  }

  async load(): Promise<Loaded<Medication>> {
    return (await this.device.read()).medications;
  }

  add(medication: Medication) {
    return this.device.writeMedications((medications) => [...medications, medication]);
  }

  update(medication: Medication) {
    return this.device.writeMedications((medications) =>
      medications.map((item) => (item.id === medication.id ? medication : item)),
    );
  }

  remove(id: string) {
    return this.device.writeMedications((medications) =>
      medications.filter((item) => item.id !== id),
    );
  }
}
