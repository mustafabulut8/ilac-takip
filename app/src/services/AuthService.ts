import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { AuthError } from '@/errors';
import { isUserRole, type Profile, type SignUpInput, type UserRole } from '@/models';
import { logger } from '@/utils/logger';
import {
  normalizeEmail,
  validateEmail,
  validateSignIn,
  validateSignUp,
} from '@/validation/auth-input';

import { toAuthError } from './auth-errors';
import type { ProfileCache } from './ProfileCache';
import type { ProfileRepository } from './ProfileRepository';

/** AuthService'in Supabase kimlik doğrulama istemcisinden kullandığı kısım; testte sahtesi verilir. */
export type AuthApi = Pick<
  SupabaseClient['auth'],
  | 'signUp'
  | 'signInWithPassword'
  | 'signOut'
  | 'resetPasswordForEmail'
  | 'getSession'
  | 'onAuthStateChange'
  | 'startAutoRefresh'
  | 'stopAutoRefresh'
>;

/**
 * Hesap akışı: kayıt, giriş, çıkış, şifre sıfırlama, oturum ve rol değiştirme.
 * Oturumu Supabase istemcisi cihazda saklar ve yeniler. Profilin tablodan okunması
 * ProfileRepository'de, cihazdaki kopyası ProfileCache'tedir; böylece internet yokken
 * de uygulama doğru ana ekranla açılır.
 */
export class AuthService {
  private readonly auth: AuthApi;
  private readonly profiles: ProfileRepository;
  private readonly cache: ProfileCache;
  private readonly configured: boolean;

  /** `configured` false ise (`.env` eksik) her işlem anlaşılır bir hatayla durur. */
  constructor(
    auth: AuthApi,
    profiles: ProfileRepository,
    cache: ProfileCache,
    configured: boolean,
  ) {
    this.auth = auth;
    this.profiles = profiles;
    this.cache = cache;
    this.configured = configured;
  }

  /** Yeni hesap açar. Profil satırını veritabanındaki tetikleyici ad ve rolden oluşturur. */
  async signUp(input: SignUpInput): Promise<Profile> {
    validateSignUp(input);
    this.ensureConfigured();
    const { data, error } = await this.auth.signUp({
      email: normalizeEmail(input.email),
      password: input.password,
      options: { data: { ad: input.name.trim(), rol: input.role } },
    });
    if (error) throw toAuthError(error);
    if (!data.session || !data.user) {
      // E-posta doğrulaması açıksa oturum hemen açılmaz (kararlar.md, 17. karar: kapalı).
      throw new AuthError(
        'unknown',
        'Kayıttan sonra oturum açılmadı; e-posta doğrulaması açık olabilir',
        'Hesabınız oluşturuldu ama giriş yapılamadı. Lütfen giriş yapmayı deneyin.',
      );
    }
    return this.loadProfile(data.user.id);
  }

  async signIn(email: string, password: string): Promise<Profile> {
    validateSignIn(email, password);
    this.ensureConfigured();
    const { data, error } = await this.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw toAuthError(error);
    return this.loadProfile(data.user.id);
  }

  /** Yalnızca bu telefondaki oturumu kapatır. İlaçlar ve hatırlatmalar cihazda kalır. */
  async signOut(): Promise<void> {
    this.ensureConfigured();
    const { error } = await this.auth.signOut({ scope: 'local' });
    if (error) throw toAuthError(error);
    await this.cache.clear();
  }

  /** Şifre sıfırlama bağlantısı gönderir. Kayıtlı olmayan adres için de aynı yanıt döner. */
  async resetPassword(email: string): Promise<void> {
    validateEmail(email);
    this.ensureConfigured();
    const { error } = await this.auth.resetPasswordForEmail(normalizeEmail(email));
    if (error) throw toAuthError(error);
  }

  /** Cihazda kayıtlı oturum; internet gerektirmez. */
  async getSession(): Promise<Session | null> {
    if (!this.configured) return null;
    const { data, error } = await this.auth.getSession();
    if (error) {
      logger.warn('Oturum okunamadı:', error);
      return null;
    }
    return data.session;
  }

  /**
   * Oturum açık kullanıcının profili; oturum yoksa null. Sunucuya ulaşılamazsa
   * aynı kullanıcının cihazdaki son profili kullanılır.
   */
  async currentProfile(): Promise<Profile | null> {
    const session = await this.getSession();
    if (!session) return null;
    try {
      return await this.loadProfile(session.user.id);
    } catch (error) {
      const cached =
        error instanceof AuthError && error.kind === 'offline'
          ? await this.cache.read(session.user.id)
          : null;
      if (cached) return cached;
      throw error;
    }
  }

  /** Ayarlar > Kullanım biçimi: rolü değiştirir. */
  async updateRole(role: UserRole): Promise<Profile> {
    if (!isUserRole(role)) {
      throw new AuthError('unknown', `Geçersiz rol: ${String(role)}`, 'Kullanım biçimini seçin.');
    }
    const session = await this.getSession();
    if (!session) {
      throw new AuthError(
        'unknown',
        'Oturum yok',
        'Oturumunuz kapanmış. Lütfen yeniden giriş yapın.',
      );
    }
    await this.profiles.updateRole(session.user.id, role);
    return this.loadProfile(session.user.id);
  }

  /** Oturum açılınca, kapanınca veya yenilenince çağrılır. Dönen fonksiyon dinlemeyi bırakır. */
  onSessionChange(listener: (session: Session | null) => void): () => void {
    if (!this.configured) return () => {};
    const { data } = this.auth.onAuthStateChange((_event, session) => listener(session));
    return () => data.subscription.unsubscribe();
  }

  /** Uygulama öndeyken oturum belirteci kendiliğinden yenilenir, arka plandayken durur. */
  setAutoRefresh(active: boolean) {
    if (!this.configured) return;
    if (active) void this.auth.startAutoRefresh();
    else void this.auth.stopAutoRefresh();
  }

  private ensureConfigured() {
    if (!this.configured) {
      throw new AuthError(
        'not_configured',
        'Supabase adresi veya anahtarı eksik (app/.env)',
        'Hesap sunucusu ayarlanmamış. Lütfen uygulamayı geliştirene haber verin.',
      );
    }
  }

  /** Profili tablodan okur ve cihazdaki kopyayı günceller. */
  private async loadProfile(userId: string): Promise<Profile> {
    const profile = await this.profiles.fetch(userId);
    await this.cache.save(profile);
    return profile;
  }
}
