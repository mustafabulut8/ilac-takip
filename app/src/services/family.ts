import type { Dose, Medication } from '@/models';
import { addDays, formatDate } from '@/utils/date';
import { isRecord } from '@/utils/json';
import { parseMedicationRow } from '@/validation/medication-rows';

import type { DoseCalculator } from './DoseCalculator';
import { MedicationService } from './MedicationService';
import type { PhotoSync } from './PhotoSync';
import type { Clock, PhotoStore, ReminderScheduler } from './ports';
import { readDoseLogs, RemoteDoseLogRepository } from './RemoteDoseLogRepository';
import { RemoteMedicationRepository } from './RemoteMedicationRepository';
import type { DeviceStatusReader, DoseLogRowsApi, MedicationRowsApi } from './remote-ports';

/**
 * Aile telefonunda yakının ilaçları için hatırlatıcı: hiçbir şey kurmaz. Hatırlatmalar
 * yalnızca ilacı kullanan kişinin telefonunda, eşitlemeden sonra kurulur.
 */
export const NO_REMINDERS: ReminderScheduler = {
  sync: async () => undefined,
  cancelMedication: async () => undefined,
};

type FamilyDependencies = {
  rows: MedicationRowsApi;
  doseRows: DoseLogRowsApi;
  photos: PhotoStore;
  /** Fotoğrafı ilaç satırından önce sunucuya yükler. */
  photoSync?: Pick<PhotoSync, 'ensureUploaded' | 'cleanUp'>;
  /** Sunucudaki değişiklikleri haber veren kanal (gerçeği: Supabase Realtime). */
  realtime?: { subscribe(ownerId: string, onChange: () => void): () => void };
  now: Clock;
};

/**
 * Aile üyesinin yakını (`patientId`) için servisler. Mevcut `MedicationService` aynen
 * kullanılır; yalnızca bağımlılıkları farklıdır: depo sunucudadır, hatırlatıcı boştur.
 * Böylece sihirbaz ve ilaç listesi yakın için de değişmeden çalışır.
 */
export function createFamilyServices(deps: FamilyDependencies, patientId: string) {
  const repositories = {
    medications: new RemoteMedicationRepository(deps.rows, patientId, deps.now, deps.photoSync),
    doseLogs: new RemoteDoseLogRepository(deps.doseRows, patientId, deps.now),
  };
  const medications = new MedicationService(repositories, deps.photos, NO_REMINDERS, deps.now);
  return {
    medications,
    /** Dozu yalnızca yakının kendisi onaylar. */
    doses: { confirmDose: async () => null },
    /**
     * Yakın veya başka bir aile üyesi ilacı değiştirince liste yenilenir. Bayat yazmada
     * (StaleWriteError) sunucudaki güncel hâl de bu yolla ekrana gelir.
     */
    changes: {
      subscribe(listener: (list: Medication[]) => void) {
        return (
          deps.realtime?.subscribe(patientId, () => {
            medications
              .load()
              .then((data) => listener(data.medications))
              .catch(() => undefined);
          }) ?? (() => undefined)
        );
      },
    },
  };
}

export type FamilySummary = {
  medications: Medication[];
  /** Bugünün dozları; durumlar `DoseCalculator`'ın kurallarıyla hesaplanır. */
  doses: Dose[];
  progress: { taken: number; total: number };
  missed: Dose[];
  /** Aile ekledi veya düzenledi, yakının telefonu henüz almadı (`delivered_at` boş). */
  undeliveredIds: string[];
  /** Yakının telefonundaki hatırlatmalar ne zamana kadar kurulu; boş: bitmiyor. */
  remindersUntil: string | null;
};

/**
 * Aile Paneli'ndeki kişi kartının verisi.
 *
 * Kaçırılan dozlar panel açıldığında burada hesaplanır. Sunucu taraflı tespit (uygulama
 * kapalıyken de) ve e-posta bildirimi 3. parçada gelecek (docs/ilerleme.md).
 */
export class FamilyDashboardService {
  private readonly rows: MedicationRowsApi;
  private readonly doseRows: DoseLogRowsApi;
  private readonly calculator: DoseCalculator;
  private readonly now: Clock;
  private readonly status: DeviceStatusReader;

  constructor(
    rows: MedicationRowsApi,
    doseRows: DoseLogRowsApi,
    calculator: DoseCalculator,
    now: Clock,
    status: DeviceStatusReader,
  ) {
    this.rows = rows;
    this.doseRows = doseRows;
    this.calculator = calculator;
    this.now = now;
    this.status = status;
  }

  async summaryOf(patientId: string): Promise<FamilySummary> {
    const now = this.now();
    const [rows, doseRows, remindersUntil] = await Promise.all([
      this.rows.list(patientId),
      this.doseRows.list(patientId, formatDate(addDays(now, -1))),
      // Telefon durumu okunamazsa panel yine açılır; yalnızca uyarı gösterilmez.
      this.status.remindersUntil(patientId).catch(() => null),
    ]);
    const medications = rows.map(parseMedicationRow).filter((item): item is Medication => !!item);
    const doses = this.calculator.getTodayDoses(medications, readDoseLogs(doseRows).items, now);
    const { taken, total } = this.calculator.progressOf(doses);
    return {
      medications,
      doses,
      progress: { taken, total },
      missed: doses.filter((dose) => dose.status === 'kacirildi'),
      undeliveredIds: rows
        .filter((row) => isRecord(row) && row.delivered_at === null)
        .map((row) => String((row as { id: unknown }).id)),
      remindersUntil,
    };
  }
}
