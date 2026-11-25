/** Uygulamayı kullanma biçimi (kararlar.md, 15. karar). Değerler veritabanındaki `rol` ile aynıdır. */
export type UserRole = 'sade' | 'standart' | 'aile';

export const USER_ROLES: readonly UserRole[] = ['sade', 'standart', 'aile'];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/** Supabase `profiles` tablosundaki satırın uygulamadaki karşılığı. */
export type Profile = {
  id: string;
  name: string;
  role: UserRole;
  /** ISO zaman */
  createdAt: string;
};

/** Kayıt formundan gelen bilgiler. */
export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  /** KVKK Aydınlatma Metni okundu ve kabul edildi mi? */
  consent: boolean;
};
