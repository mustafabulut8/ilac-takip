import { z } from 'zod';

import type { DoseLog, Medication } from '@/models';
import { safeJsonParse } from '@/utils/json';
import { logger } from '@/utils/logger';

import type { KeyValueStore } from './local/LocalDeviceStore';
import type { Clock } from './ports';
import type { DoseLogRepository, MedicationRepository } from './repositories';

/**
 * Sunucuya gönderilmeyi bekleyen değişiklikler (giden kutusu, `outbox` anahtarı).
 * Telefon çevrimdışıyken de çalışır: her değişiklik önce telefona yazılır, sonra
 * buraya eklenir; `SyncService` internet olunca sırayla gönderir (kararlar.md ADR-022).
 *
 * İlaç için yalnızca kimlik saklanır; gönderirken ilacın telefondaki o anki hâli
 * okunur. Böylece aynı ilacın art arda değişiklikleri tek gönderimde birleşir.
 */
export type OutboxEntry =
  | { kind: 'medication'; id: string }
  | { kind: 'medicationDeleted'; id: string; at: string }
  | { kind: 'dose'; log: DoseLog; amount: number };

const KEY = 'outbox';

const entrySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('medication'), id: z.string() }),
  z.object({ kind: z.literal('medicationDeleted'), id: z.string(), at: z.string() }),
  z.object({
    kind: z.literal('dose'),
    log: z.object({
      id: z.string(),
      medicationId: z.string(),
      date: z.string(),
      time: z.string(),
      takenAt: z.string(),
    }),
    amount: z.number(),
  }),
]);

/** Aynı kaydı anlatan iki giriş (ilaç için kimlik, doz için doz kimliği). */
function keyOf(entry: OutboxEntry) {
  return entry.kind === 'dose' ? `dose:${entry.log.id}` : `medication:${entry.id}`;
}

export class Outbox {
  private readonly store: KeyValueStore;
  /** Yazmalar sıraya girer; aynı anda iki değişiklik birbirini ezmez. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(store: KeyValueStore) {
    this.store = store;
  }

  async entries(): Promise<OutboxEntry[]> {
    await this.queue;
    return this.read();
  }

  /** Aynı kaydın eski girişi çıkarılıp yenisi sona eklenir (silme, değişikliğin yerini alır). */
  enqueue(entry: OutboxEntry) {
    return this.change((entries) => [
      ...entries.filter((item) => keyOf(item) !== keyOf(entry)),
      entry,
    ]);
  }

  /** Gönderilen giriş çıkarılır. Bu arada aynı kayda yeni değişiklik geldiyse o kalır. */
  remove(sent: OutboxEntry) {
    return this.change((entries) =>
      entries.filter((item) => JSON.stringify(item) !== JSON.stringify(sent)),
    );
  }

  async hasPendingMedication(id: string) {
    return (await this.entries()).some((entry) => keyOf(entry) === `medication:${id}`);
  }

  private change(next: (entries: OutboxEntry[]) => OutboxEntry[]): Promise<void> {
    const run = this.queue.then(async () => {
      await this.store.setItem(KEY, JSON.stringify(next(await this.read())));
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async read(): Promise<OutboxEntry[]> {
    const parsed = safeJsonParse((await this.store.getItem(KEY)) ?? '[]');
    const result = z.array(entrySchema).safeParse(parsed.ok ? parsed.value : null);
    if (result.success) return result.data;
    logger.warn(
      'Giden kutusu okunamadı; boş sayıldı (veri telefonda duruyor, ilk eşitlemede yeniden gönderilir).',
    );
    return [];
  }
}

/** Eşitleme açık mı (rıza verilmiş ve oturum var mı)? Kapalıyken kuyruk büyümez. */
type SyncEnabled = () => boolean;

/** Önce telefona yazar, sonra kuyruğa ekler (Decorator). Telefona yazılamazsa kuyruğa girmez. */
export class OfflineFirstMedicationRepository implements MedicationRepository {
  private readonly local: MedicationRepository;
  private readonly outbox: Outbox;
  private readonly enabled: SyncEnabled;
  private readonly now: Clock;

  constructor(local: MedicationRepository, outbox: Outbox, enabled: SyncEnabled, now: Clock) {
    this.local = local;
    this.outbox = outbox;
    this.enabled = enabled;
    this.now = now;
  }

  load() {
    return this.local.load();
  }

  async add(medication: Medication) {
    await this.local.add(medication);
    if (this.enabled()) await this.outbox.enqueue({ kind: 'medication', id: medication.id });
  }

  async update(medication: Medication) {
    await this.local.update(medication);
    if (this.enabled()) await this.outbox.enqueue({ kind: 'medication', id: medication.id });
  }

  async remove(id: string) {
    await this.local.remove(id);
    if (this.enabled()) {
      await this.outbox.enqueue({ kind: 'medicationDeleted', id, at: this.now().toISOString() });
    }
  }
}

/**
 * Doz onayını telefona yazar ve düşen miktarla kuyruğa ekler. Sunucuda stoğu
 * `record_dose` kendisi düşürür; ilacın kendisi gönderilmez, böylece ailenin aynı
 * andaki düzenlemesiyle çakışmaz.
 */
export class OfflineFirstDoseLogRepository implements DoseLogRepository {
  private readonly local: DoseLogRepository;
  private readonly medications: MedicationRepository;
  private readonly outbox: Outbox;
  private readonly enabled: SyncEnabled;

  constructor(
    local: DoseLogRepository,
    medications: MedicationRepository,
    outbox: Outbox,
    enabled: SyncEnabled,
  ) {
    this.local = local;
    this.medications = medications;
    this.outbox = outbox;
    this.enabled = enabled;
  }

  load() {
    return this.local.load();
  }

  async recordDose(log: DoseLog, medication: Medication) {
    const before = (await this.medications.load()).items.find((item) => item.id === medication.id);
    await this.local.recordDose(log, medication);
    if (!this.enabled()) return;
    const amount = Math.max((before?.stock ?? medication.stock) - medication.stock, 0);
    await this.outbox.enqueue({ kind: 'dose', log, amount });
  }
}
