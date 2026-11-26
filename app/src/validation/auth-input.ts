import { ValidationError } from '@/errors';
import {
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  type SignInField,
  type SignUpField,
  type SignUpInput,
} from '@/models';

import { emailSchema, matches, userRoleSchema } from './schemas';

/** Boşlukları atar ve küçük harfe çevirir; "Ali@Mail.com " → "ali@mail.com". */
export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase('en-US');
}

function emailError(email: string): string | undefined {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'E-posta adresinizi yazın.';
  // Basit biçim denetimi; adresin gerçekten var olup olmadığını sunucu bilir.
  if (!matches(emailSchema, normalized))
    return 'E-posta adresi doğru görünmüyor. Örnek: ornek@mail.com';
  return undefined;
}

/** Kayıt bilgilerini denetler; hatalıysa alan alan Türkçe mesajlarla ValidationError atar. */
export function validateSignUp(input: SignUpInput): void {
  const errors: Partial<Record<SignUpField, string>> = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Adınızı yazın.';
  else if (name.length > MAX_NAME_LENGTH)
    errors.name = `Ad en fazla ${MAX_NAME_LENGTH} karakter olabilir.`;

  const email = emailError(input.email);
  if (email) errors.email = email;

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }
  if (!matches(userRoleSchema, input.role)) errors.role = 'Kullanım biçimini seçin.';
  if (!input.consent) errors.consent = 'Devam etmek için aydınlatma metnini onaylayın.';

  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}

/** Giriş bilgilerini denetler; şifrenin uzunluğuna bakılmaz, yalnızca boş olmamalı. */
export function validateSignIn(email: string, password: string): void {
  const errors: Partial<Record<SignInField, string>> = {};
  const emailMessage = emailError(email);
  if (emailMessage) errors.email = emailMessage;
  if (!password) errors.password = 'Şifrenizi yazın.';
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}

/** Şifre sıfırlama için yalnızca e-posta denetlenir. */
export function validateEmail(email: string): void {
  const message = emailError(email);
  if (message) throw new ValidationError({ email: message });
}
