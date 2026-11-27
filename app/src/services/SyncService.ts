import { z } from 'zod';

import { StaleWriteError } from '@/errors';
import type { Medication } from '@/models';
import { isRecord, safeJsonParse } from '@/utils/json';
import { logger } from '@/utils/logger';
import { parseMedicationRow } from '@/validation/medication-rows';

import type { KeyValueStore } from './local/LocalDeviceStore';
import type { Outbox, OutboxEntry } from './Outbox';
import type { ReminderScheduler } from './ports';
import type { DeliveredItem, SyncApi } from './remote-ports';
import type { DoseLogRepository, MedicationRepository } from './repositories';

/** Sunucudaki ilaçlar; silme anı verilebilir (kuyruktaki silme, yapıldığı anla gider). */
type RemoteMedications = MedicationRepository & { remove(id: string, at?: string): Promise<void> };

export type SyncDependencies = {
  /** Telefondaki depo, kuyruksuz: sunucudan gelen değişiklik yeniden kuyruğa girmesin. */
  local: MedicationRepository;
  localDoseLogs: DoseLogRepository;
  remoteFor: (ownerId: string) => RemoteMedications;
  api: SyncApi;
  outbox: Outbox;
  store: KeyValueStore;
  reminders: ReminderScheduler;
};

type Listener = (medications: Medication[]) => void;

const STATE_KEY = 'syncState';

/**
 * Fotoğraf dosyası her telefonun kendisinindir; sunucu satırında yalnızca yolu vardır.
 * Yerel dosya, sunucudaki fotoğrafla aynıysa (ya da onu bu telefon yüklediyse) korunur.
 * Fotoğraf başka yerde değiştiyse bırakılır; yenisi imzalı adresle gösterilir.
 */
function localPhotoFor(local: Medication | null, current: Medication) {
  if (!local?.photoFile) return '';
  const sameOrOwnUpload = !local.photoPath || local.photoPath === current.photoPath;
  return sameOrOwnUpload ? local.photoFile : '';
}
const stateSchema = z.object({ ownerId: z.string(), cursor: z.string().nullable() });

/**
 * Telefon ile sunucu arasındaki eşitleme (kararlar.md ADR-022).
 *
 * 1. Gönderme: kuyruktaki değişiklikler sırayla gider. Sunucu eski sürümü atlarsa
 *    (`StaleWriteError`) telefon ilacın sunucudaki güncel hâline geçer.
 * 2. Alma: imleçten sonra değişen ilaçlar gelir. Telefondaki sürüm daha yeni değilse
 *    uygulanır; silinenler kaldırılır. Ardından alınanlar "telefona ulaştı" diye işaretlenir.
 *
 * Telefondaki bir ilaç değiştiyse veya silindiyse önce onun hatırlatmaları kaldırılır,
 * sonra bütün liste yeniden kurulur (ailenin düzenlemesi de böyle telefona ulaşır).
 * Değişen liste dinleyicilere (ekran durumu) bildirilir.
 */
export class SyncService {
  private readonly deps: SyncDependencies;
  private ownerId: string | null = null;
  private enabled = false;
  private running: Promise<void> | null = null;
  private readonly listeners = new Set<Listener>();

  constructor(deps: SyncDependencies) {
    this.deps = deps;
  }

  setOwner(ownerId: string | null) {
    this.ownerId = ownerId;
  }

  /** Eşitlenen hesabın kimliği (oturum yoksa `null`). */
  currentOwner() {
    return this.ownerId;
  }

  isEnabled() {
    return this.enabled && this.ownerId !== null;
  }

  start() {
    this.enabled = true;
  }

  async stop() {
    this.enabled = false;
    await this.running;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Çalışan eşitleme varsa ona katılır. Hata fırlatmaz; kuyruk bir sonrakinde yeniden denenir. */
  run(): Promise<void> {
    if (!this.isEnabled()) return Promise.resolve();
    this.running ??= this.runOnce().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /**
   * Rıza verildikten sonraki ilk yükleme: telefondaki bütün ilaçlar ve doz onayları
   * kuyruğa girer. Dozlar sıfır miktarla gider; ilacın stoğu zaten düşmüş hâliyle gönderilir.
   */
  async uploadAll() {
    const [medications, doseLogs] = await Promise.all([
      this.deps.local.load(),
      this.deps.localDoseLogs.load(),
    ]);
    for (const medication of medications.items) {
      await this.deps.outbox.enqueue({ kind: 'medication', id: medication.id });
    }
    for (const log of doseLogs.items) {
      await this.deps.outbox.enqueue({ kind: 'dose', log, amount: 0 });
    }
    await this.run();
  }

  private async runOnce() {
    const ownerId = this.ownerId;
    if (!ownerId) return;
    try {
      const pushed = await this.push(ownerId);
      const pulled = this.enabled ? await this.pull(ownerId) : [];
      const changed = [...pushed, ...pulled];
      if (changed.length > 0) await this.afterLocalChange(changed);
    } catch (error) {
      logger.warn('Eşitleme tamamlanamadı; bir sonraki denemede sürecek:', error);
    }
  }

  /** Telefonda değişen ilaçların eski hâllerini döner (hatırlatmaları kaldırılacak). */
  private async push(ownerId: string): Promise<Medication[]> {
    const remote = this.deps.remoteFor(ownerId);
    const changed: Medication[] = [];
    for (const entry of await this.deps.outbox.entries()) {
      if (!this.enabled) break;
      try {
        await this.send(remote, entry);
      } catch (error) {
        if (!(error instanceof StaleWriteError)) throw error;
        const old = await this.applyLocally(entry.kind === 'dose' ? '' : entry.id, error.current);
        if (old) changed.push(old);
      }
      await this.deps.outbox.remove(entry);
    }
    return changed;
  }

  private async send(remote: RemoteMedications, entry: OutboxEntry) {
    if (entry.kind === 'dose') return this.deps.api.recordDose(entry.log, entry.amount);
    if (entry.kind === 'medicationDeleted') return remote.remove(entry.id, entry.at);
    const medication = (await this.deps.local.load()).items.find((item) => item.id === entry.id);
    // Bu arada telefonda silindiyse silme kaydı ayrıca gönderilir.
    if (medication) await remote.update(medication);
  }

  private async pull(ownerId: string): Promise<Medication[]> {
    const cursor = await this.readCursor(ownerId);
    const rows = await this.deps.api.changedSince(ownerId, cursor);
    const changed: Medication[] = [];
    const delivered: DeliveredItem[] = [];
    for (const row of rows) {
      if (!isRecord(row) || typeof row.id !== 'string') continue;
      const old = await this.applyRow(row as Record<string, unknown> & { id: string });
      if (old) changed.push(old);
      if (row.delivered_at === null && row.deleted_at === null) {
        delivered.push({ id: row.id, server_updated_at: String(row.server_updated_at) });
      }
    }
    const last = rows.at(-1);
    if (isRecord(last)) await this.saveCursor(ownerId, String(last.server_updated_at));
    if (delivered.length > 0) await this.deps.api.markDelivered(delivered);
    return changed;
  }

  /** Sunucudaki satırı telefona uygular; telefondaki daha yeni sürüm ezilmez. */
  private async applyRow(row: Record<string, unknown> & { id: string }) {
    if (await this.deps.outbox.hasPendingMedication(row.id)) return null;
    const deleted = row.deleted_at !== null && row.deleted_at !== undefined;
    const incoming = deleted ? null : parseMedicationRow(row);
    if (!deleted && !incoming) return null;
    const local = await this.find(row.id);
    if (local && incoming && Date.parse(incoming.updatedAt) < Date.parse(local.updatedAt)) {
      return null;
    }
    return this.applyLocally(row.id, incoming);
  }

  /**
   * Telefondaki kopyayı sunucudaki hâle getirir (`null`: silindi). Değişen ilacın
   * eski hâlini döner; değişiklik yoksa `null`.
   */
  private async applyLocally(id: string, current: Medication | null): Promise<Medication | null> {
    const local = await this.find(id);
    if (!current) {
      if (local) await this.deps.local.remove(id);
      return local;
    }
    const next = { ...current, photoFile: localPhotoFor(local, current) };
    if (local && JSON.stringify(local) === JSON.stringify(next)) return null;
    if (local) await this.deps.local.update(next);
    else await this.deps.local.add(next);
    return local ?? next;
  }

  private async afterLocalChange(changed: Medication[]) {
    const medications = (await this.deps.local.load()).items;
    try {
      for (const old of changed) await this.deps.reminders.cancelMedication(old);
      await this.deps.reminders.sync(medications);
    } catch (error) {
      logger.warn('Eşitlemeden sonra hatırlatmalar kurulamadı:', error);
    }
    for (const listener of this.listeners) listener(medications);
  }

  private async find(id: string) {
    return (await this.deps.local.load()).items.find((item) => item.id === id) ?? null;
  }

  private async readCursor(ownerId: string): Promise<string | null> {
    const parsed = safeJsonParse((await this.deps.store.getItem(STATE_KEY)) ?? '');
    const state = stateSchema.safeParse(parsed.ok ? parsed.value : null);
    return state.success && state.data.ownerId === ownerId ? state.data.cursor : null;
  }

  private saveCursor(ownerId: string, cursor: string) {
    return this.deps.store.setItem(STATE_KEY, JSON.stringify({ ownerId, cursor }));
  }
}
