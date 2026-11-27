/** İSKELET: hesap değişince henüz hiçbir şey yapmıyor (kırmızı test için). */
export type AccountSessionDeps = {
  store: { setUser(userId: string | null): void };
  device: { reset(): void };
  sync: { stop(): Promise<void>; setOwner(ownerId: string | null): void };
  reminders: { clearAll(): Promise<void> };
  lastUser: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
  };
};

export class AccountSession {
  constructor(_deps: AccountSessionDeps) {}

  async activate(_userId: string | null): Promise<void> {}
}
