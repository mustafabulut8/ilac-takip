/**
 * Uygulamaya özel hataların ortak sınıfı. `userMessage` kullanıcıya gösterilecek
 * Türkçe metindir; `message` ise kayıtlara (log) yazılan teknik açıklamadır.
 */
export class AppError extends Error {
  readonly userMessage: string;

  constructor(message: string, userMessage: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
    this.userMessage = userMessage;
    // Babel ile derlenen sınıflarda `instanceof` kontrolünün doğru çalışması için.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Hata AppError ise Türkçe mesajını, değilse verilen varsayılan metni döner. */
export function userMessageOf(error: unknown, fallback: string): string {
  return error instanceof AppError ? error.userMessage : fallback;
}
