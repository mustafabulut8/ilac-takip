import { AppError } from './app-error';

/** Hesap işlemlerindeki hata türleri; ekran bunlara göre ek yönlendirme yapabilir. */
export type AuthErrorKind =
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'invalid_email'
  | 'offline'
  | 'rate_limited'
  | 'not_configured'
  | 'profile_missing'
  | 'session_expired'
  | 'unknown';

/** Kayıt, giriş, çıkış ve şifre sıfırlama hataları. */
export class AuthError extends AppError {
  readonly kind: AuthErrorKind;

  constructor(
    kind: AuthErrorKind,
    message: string,
    userMessage: string,
    options?: { cause?: unknown },
  ) {
    super(message, userMessage, options);
    this.kind = kind;
  }
}
