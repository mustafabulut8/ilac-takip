import type { DoseLog, Medication } from '@/models';

import type { DoseLogRepository, Loaded } from '../repositories';
import type { LocalDeviceStore } from './LocalDeviceStore';

/** Doz onayları cihazda, `doseLogs` anahtarında (anahtar ve alan adları değişmez). */
export class LocalDoseLogRepository implements DoseLogRepository {
  private readonly device: LocalDeviceStore;

  constructor(device: LocalDeviceStore) {
    this.device = device;
  }

  async load(): Promise<Loaded<DoseLog>> {
    return (await this.device.read()).doseLogs;
  }

  recordDose(log: DoseLog, medication: Medication) {
    return this.device.writeDose(log, medication);
  }
}
