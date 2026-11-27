import { StaleWriteError } from '@/errors';
import type { Medication } from '@/models';
import { isRecord } from '@/utils/json';
import { parseMedicationRow, toMedicationRow } from '@/validation/medication-rows';

import type { Clock } from './ports';
import type { MedicationRowsApi } from './remote-ports';
import type { Loaded, MedicationRepository } from './repositories';

/**
 * Bir kişinin sunucudaki ilaçları (`ownerId`). Aile panelinde yakının ilaçları, telefonda
 * eşitleme bu sınıfla okunur ve yazılır.
 *
 * Sunucu "son yazan kazanır" kuralıyla eski sürümle gelen değişikliği hata vermeden atlar.
 * Bu sınıf atlamayı fark eder: satırı yeniden çeker ve güncel hâliyle `StaleWriteError`
 * fırlatır. Böylece hiçbir ekran kendi eski kopyasını doğru sanmaz.
 */
export class RemoteMedicationRepository implements MedicationRepository {
  private readonly rows: MedicationRowsApi;
  private readonly ownerId: string;
  private readonly now: Clock;

  constructor(rows: MedicationRowsApi, ownerId: string, now: Clock) {
    this.rows = rows;
    this.ownerId = ownerId;
    this.now = now;
  }

  async load(): Promise<Loaded<Medication>> {
    const rows = await this.rows.list(this.ownerId);
    const items = rows.map(parseMedicationRow).filter((item): item is Medication => !!item);
    const invalid = rows.length - items.length;
    return { items, warnings: invalid > 0 ? [`Sunucudaki ${invalid} ilaç okunamadı.`] : [] };
  }

  add(medication: Medication) {
    return this.write(medication);
  }

  update(medication: Medication) {
    return this.write(medication);
  }

  /** `at`: silinme anı; telefondaki kuyruk silmenin yapıldığı anı verir (son yazan kazanır). */
  async remove(id: string, at = this.now().toISOString()) {
    const written = await this.rows.softDelete(id, at);
    if (!written) await this.throwStale(id);
  }

  private async write(medication: Medication) {
    const written = await this.rows.write(toMedicationRow(medication, this.ownerId));
    if (!written) await this.throwStale(medication.id);
  }

  private async throwStale(id: string): Promise<never> {
    const row = await this.rows.fetch(id);
    // Bu arada silinmişse güncel hâl yoktur; çağıran taraf ilacı kendi listesinden kaldırır.
    const deleted = isRecord(row) && row.deleted_at !== null && row.deleted_at !== undefined;
    throw new StaleWriteError(id, deleted ? null : parseMedicationRow(row));
  }
}
