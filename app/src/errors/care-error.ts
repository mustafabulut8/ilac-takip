import { AppError } from './app-error';

/** Davet kodu kullanılırken sunucunun döndürdüğü sonuçlar. */
export type CareErrorKind = 'invalid_code' | 'too_many_attempts' | 'unknown';

/** Kodla bağlanma hatası; ekran `userMessage`'ı gösterir. */
export class CareError extends AppError {
  readonly kind: CareErrorKind;

  constructor(kind: CareErrorKind, userMessage: string) {
    super(`Davet kodu kullanılamadı: ${kind}`, userMessage);
    this.kind = kind;
  }
}
