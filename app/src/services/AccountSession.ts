import type { KeyValueStore } from './local/LocalDeviceStore';

/** Telefonda en son kimin oturum açtığı (kullanıcıya özel olmayan anahtar). */
const ACTIVE_USER_KEY = 'activeUser';

export type AccountSessionDeps = {
  store: { setUser(userId: string | null): void };
  device: { reset(): void };
  sync: { stop(): Promise<void>; setOwner(ownerId: string | null): void };
  reminders: { clearAll(): Promise<void> };
  /** Kullanıcıya özel olmayan depo (AsyncStorage). */
  lastUser: Pick<KeyValueStore, 'getItem' | 'setItem'>;
};

/**
 * Telefondaki etkin hesap (ADR-027). Oturum açılınca, kapanınca veya hesap değişince:
 * 1. eşitleme durur ve sahibi bırakılır;
 * 2. telefonda başka birinin hatırlatmaları kaldıysa hepsi kaldırılır;
 * 3. yerel depo yeni kullanıcıya geçer, bellekteki kopya bırakılır.
 *
 * Yeni kullanıcının hatırlatmaları, listesi yüklenince kurulur (`MedicationService.load`).
 * Aynı kişi uygulamayı yeniden açınca hiçbir şey kaldırılmaz (ertelenen bildirim de kalır).
 */
export class AccountSession {
  private readonly deps: AccountSessionDeps;
  /** `undefined`: bu açılışta henüz hiç etkinleştirilmedi. */
  private active: string | null | undefined;
  private queue: Promise<void> = Promise.resolve();

  constructor(deps: AccountSessionDeps) {
    this.deps = deps;
  }

  /** Çağrılar sırayla işlenir; aynı hesap için tekrar çağrı bir şey yapmaz. */
  activate(userId: string | null): Promise<void> {
    this.queue = this.queue.catch(() => undefined).then(() => this.switchTo(userId));
    return this.queue;
  }

  private async switchTo(userId: string | null) {
    if (userId === this.active) return;
    const { store, device, sync, reminders, lastUser } = this.deps;
    await sync.stop();
    sync.setOwner(null);

    const last = (await lastUser.getItem(ACTIVE_USER_KEY)) || null;
    if (last && last !== userId) await reminders.clearAll();

    store.setUser(userId);
    device.reset();
    await lastUser.setItem(ACTIVE_USER_KEY, userId ?? '');
    this.active = userId;
  }
}
