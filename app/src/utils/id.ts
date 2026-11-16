/** Zaman damgası ve rastgele ekten oluşan kısa, benzersiz kimlik. */
export function createId(now: Date = new Date()) {
  return `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
