import type { KeyValueStore } from './LocalDeviceStore';

/** İSKELET: henüz kullanıcıya göre ayırmıyor (kırmızı test için). */
export class UserScopedStore implements KeyValueStore {
  private readonly base: KeyValueStore;

  constructor(base: KeyValueStore) {
    this.base = base;
  }

  setUser(_userId: string | null) {}

  getItem(key: string) {
    return this.base.getItem(key);
  }

  setItem(key: string, value: string) {
    return this.base.setItem(key, value);
  }

  multiSet(pairs: [string, string][]) {
    return this.base.multiSet(pairs);
  }

  multiRemove(keys: string[]) {
    return this.base.multiRemove(keys);
  }
}
