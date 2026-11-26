import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthError } from '@/errors';
import { isUserRole, type Profile, type UserRole } from '@/models';
import type { Database, Tables } from '@/types/database';

import { toAuthError } from './auth-errors';

/** `profiles` tablosuna erişim için Supabase istemcisinden kullanılan kısım. */
export type ProfilesBackend = Pick<SupabaseClient<Database>, 'from'>;

/** `profiles` tablosundaki satır (üretilen tipten); sütun adları veritabanındaki gibidir. */
type ProfileRow = Tables<'profiles'>;

/**
 * `profiles` tablosunun okunması ve güncellenmesi. Veritabanının Türkçe sütun adlarını
 * (`ad`, `rol`, `olusturma_zamani`) uygulamanın alanlarına çevirir. Satırı kayıtta
 * veritabanındaki tetikleyici oluşturur (18. karar); uygulama profil eklemez.
 */
export class ProfileRepository {
  private readonly db: ProfilesBackend;

  constructor(db: ProfilesBackend) {
    this.db = db;
  }

  /** Kullanıcının profili; satır yoksa veya bozuksa `profile_missing` hatası. */
  async fetch(userId: string): Promise<Profile> {
    const { data, error } = await this.db
      .from('profiles')
      .select('id, ad, rol, olusturma_zamani')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw toAuthError(error);
    const profile = ProfileRepository.profileOf(data);
    if (!profile) {
      throw new AuthError(
        'profile_missing',
        `Profil bulunamadı veya bozuk: ${userId}`,
        'Hesap bilgileriniz bulunamadı. Lütfen çıkış yapıp yeniden giriş yapın.',
      );
    }
    return profile;
  }

  async updateRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await this.db.from('profiles').update({ rol: role }).eq('id', userId);
    if (error) throw toAuthError(error);
  }

  private static profileOf(row: ProfileRow | null): Profile | null {
    if (!row || typeof row.ad !== 'string' || !isUserRole(row.rol)) return null;
    return { id: row.id, name: row.ad, role: row.rol, createdAt: row.olusturma_zamani };
  }
}
