import { ValidationError } from '@/errors';

import { normalizeEmail, validateEmail, validateSignIn, validateSignUp } from '../auth-input';

const valid = {
  name: 'Ayşe',
  email: 'ayse@mail.com',
  password: 'gizli1234',
  role: 'standart' as const,
  consent: true,
};

function fieldsOf(action: () => void) {
  try {
    action();
  } catch (error) {
    if (error instanceof ValidationError) return error.fields;
    throw error;
  }
  return {};
}

describe('auth-input', () => {
  it('e-postayı kırpar ve küçük harfe çevirir', () => {
    expect(normalizeEmail('  Ali@Mail.COM ')).toBe('ali@mail.com');
  });

  it('geçerli kayıt bilgisini kabul eder', () => {
    expect(() => validateSignUp(valid)).not.toThrow();
  });

  it('kayıtta her hatalı alan için Türkçe mesaj verir', () => {
    expect(
      fieldsOf(() =>
        validateSignUp({
          name: '   ',
          email: 'ayse@',
          password: '1234567',
          role: 'yonetici' as never,
          consent: false,
        }),
      ),
    ).toEqual({
      name: 'Adınızı yazın.',
      email: 'E-posta adresi doğru görünmüyor. Örnek: ornek@mail.com',
      password: 'Şifre en az 8 karakter olmalı.',
      role: 'Kullanım biçimini seçin.',
      consent: 'Devam etmek için aydınlatma metnini onaylayın.',
    });
  });

  it('100 karakterden uzun adı reddeder', () => {
    expect(fieldsOf(() => validateSignUp({ ...valid, name: 'a'.repeat(101) }))).toHaveProperty(
      'name',
    );
  });

  it('girişte şifre uzunluğuna bakmaz, yalnızca boş olmamalı', () => {
    expect(() => validateSignIn('ayse@mail.com', '1')).not.toThrow();
    expect(fieldsOf(() => validateSignIn('', ''))).toEqual({
      email: 'E-posta adresinizi yazın.',
      password: 'Şifrenizi yazın.',
    });
  });

  it('şifre sıfırlamada yalnızca e-postayı denetler', () => {
    expect(() => validateEmail('ayse@mail.com')).not.toThrow();
    expect(fieldsOf(() => validateEmail('ayse'))).toHaveProperty('email');
  });
});
