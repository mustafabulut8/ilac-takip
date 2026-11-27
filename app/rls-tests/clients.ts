import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database, TablesInsert } from '../src/types/database';

/**
 * RLS entegrasyon testlerinin ortak parçaları. Testler gerçek projeye karşı, gerçek
 * kullanıcı gibi oturum açarak çalışır; secret anahtar kullanılmaz, böylece RLS
 * kuralları uygulamadan gelen istekteki gibi denenir.
 *
 * Ayarlar: proje adresi ve publishable anahtar `.env`'den, test hesapları
 * `.env.test`'ten okunur (`jest.rls.setup.js`; ikisi de commit edilmez, örnek:
 * `.env.test.example`).
 */

export type Db = SupabaseClient<Database>;
type Role = 'sade' | 'standart' | 'aile';

function required(name: string): string {
  // Uygulama kodunda Expo, EXPO_PUBLIC_ değişkenlerini derlemede yerine koyar; bu testler
  // ise Node'da çalışır ve değerleri jest.rls.setup.js'in okuduğu dosyalardan alır.
  // eslint-disable-next-line expo/no-dynamic-env-var
  const value = process.env[name];
  if (!value) throw new Error(`${name} eksik: app/.env veya app/.env.test dosyasını doldurun.`);
  return value;
}

export function newClient(): Db {
  return createClient<Database>(
    required('EXPO_PUBLIC_SUPABASE_URL'),
    required('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type TestUser = { id: string; db: Db };

/**
 * Test hesabıyla oturum açar; hesap yoksa (ilk çalıştırma) verilen ad ve rolle
 * kayıt olur. Prototipte e-posta doğrulaması kapalı olduğu için (ADR-017) kayıt
 * hemen oturum açar.
 */
export async function signInAs(key: string, name: string, role: Role): Promise<TestUser> {
  const email = required(`RLS_${key}_EMAIL`);
  const password = required(`RLS_${key}_PASSWORD`);
  const db = newClient();
  const signedIn = await db.auth.signInWithPassword({ email, password });
  if (signedIn.data.user) return { id: signedIn.data.user.id, db };

  const signedUp = await db.auth.signUp({
    email,
    password,
    options: { data: { ad: name, rol: role } },
  });
  if (!signedUp.data.user || !signedUp.data.session) {
    throw new Error(`${key} hesabı açılamadı: ${signedUp.error?.message ?? 'oturum yok'}`);
  }
  return { id: signedUp.data.user.id, db };
}

/** Test ilacı; kimlikler `rls-test-` önekiyle başlar. */
export function testMedication(
  id: string,
  ownerId: string,
  overrides: Partial<TablesInsert<'medications'>> = {},
): TablesInsert<'medications'> {
  const now = new Date().toISOString();
  return {
    id: `rls-test-${id}`,
    owner_id: ownerId,
    name: 'RLS Test İlacı',
    dose: '1 tablet',
    form: 'tablet',
    amount: 1,
    unit: 'adet',
    location: '',
    meal_timing: 'any',
    times: ['08:00', '20:00'],
    schedule: { kind: 'daily' },
    duration: { kind: 'continuous' },
    start_date: now.slice(0, 10),
    past_plans: [],
    stock: 10,
    low_stock_threshold: 5,
    marked_low: false,
    photo_path: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/** En küçük geçerli JPEG (1×1 piksel). */
export const TINY_JPEG = Uint8Array.from(
  atob(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  ),
  (char) => char.charCodeAt(0),
);
