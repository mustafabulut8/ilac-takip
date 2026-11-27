import { logger } from '@/utils/logger';

import type { Clock } from './ports';
import type { DeviceStatusApi } from './remote-ports';

type SyncState = { isEnabled(): boolean; currentOwner(): string | null };

/**
 * Telefondaki hatırlatmaların ne zamana kadar kurulu olduğunu sunucuya yazar
 * (`device_status.reminders_until`). iOS 64 bildirim tutar; uzun ve çok saatli kürlerde
 * kalanlar ancak uygulama açılınca kurulur. Aile paneli 48 saatten az kalınca uyarır.
 * Yalnızca sağlık verisi rızası varken (eşitleme açık) gönderilir.
 */
export class DeviceStatusReporter {
  private readonly api: DeviceStatusApi;
  private readonly sync: SyncState;
  private readonly now: Clock;
  /** Son başarıyla yazılan değer; aynısı tekrar gönderilmez. */
  private lastSent: string | null | undefined;

  constructor(api: DeviceStatusApi, sync: SyncState, now: Clock) {
    this.api = api;
    this.sync = sync;
    this.now = now;
  }

  async report(remindersUntil: Date | null) {
    const ownerId = this.sync.currentOwner();
    if (!this.sync.isEnabled() || !ownerId) return;
    const value = remindersUntil?.toISOString() ?? null;
    const key = `${ownerId}|${value}`;
    if (key === this.lastSent) return;
    try {
      await this.api.write({
        owner_id: ownerId,
        reminders_until: value,
        last_synced_at: this.now().toISOString(),
      });
      this.lastSent = key;
    } catch (error) {
      logger.warn('Telefon durumu sunucuya yazılamadı:', error);
    }
  }
}
