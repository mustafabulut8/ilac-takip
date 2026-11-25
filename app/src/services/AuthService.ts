import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { AuthError } from '@/errors';
import { isUserRole, type Profile, type SignUpInput, type UserRole } from '@/models';
import { isRecord, safeJsonParse } from '@/utils/json';
import { logger } from '@/utils/logger';
import {
  normalizeEmail,
  validateEmail,
  validateSignIn,
  validateSignUp,
} from '@/validation/auth-input';

/** AuthService'in Supabase istemcisinden kullandığı kısım; testte sahtesi verilir. */
export type AuthBackend = {
  auth: Pick<
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
  from: SupabaseClient['from'];
};

/** Profilin cihazdaki kopyası için anahtar-değer deposu (AsyncStorage). */
export type ProfileCache = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

/** `profiles` tablosundaki satır; sütun adları veritabanındaki gibidir. */
type ProfileRow = { id: string; ad: string; rol: string; olusturma_zamani: string };

/** Supabase ve ağ hatalarından okunan alanlar. */
type ErrorLike = { name?: unknown; code?: unknown; status?: unknown; message?: unknown };

const OFFLINE_MESSAGE = 'İnternet bağlantısı yok. Bağlantınızı kontrol edip yeniden deneyin.';

/**
 * Hesap işlemleri: kayıt, giriş, çıkış, şifre sıfırlama ve profil.
 * Oturumu Supabase istemcisi cihazda saklar ve yeniler. Profil (ad ve rol) ayrıca
 * cihazda tutulur; böylece internet yokken de uygulama doğru ana ekranla açılır.
 */
export class AuthService {
  static readonly PROFILE_CACHE_KEY = 'profile';

  private readonly backend: AuthBackend;
  private readonly cache: ProfileCache;
  private readonly configured: boolean;

  /** `configured` false ise (`.env` eksik) her işlem anlaşılır bir hatayla durur. */
  constructor(backend: AuthBackend, cache: ProfileCache, configured = true) {
    this.backend = backend;
    this.cache = cache;
    this.configured = configured;
  }

  /** Yeni hesap açar. Profil satırını veritabanındaki tetikleyici ad ve rolden oluşturur. */
  async signUp(input: SignUpInput): Promise<Profile> {
    validateSignUp(input);
    this.ensureConfigured();
    const { data, error } = await this.backend.auth.signUp({
      email: normalizeEmail(input.email),
      password: input.password,
      options: { data: { ad: input.name.trim(), rol: input.role } },
    });
    if (error) throw AuthService.toAuthError(error);
    if (!data.session || !data.user) {
      // E-posta doğrulaması açıksa oturum hemen açılmaz (kararlar.md, 17. karar: kapalı).
      throw new AuthError(
        'unknown',
        'Kayıttan sonra oturum açılmadı; e-posta doğrulaması açık olabilir',
        'Hesabınız oluşturuldu ama giriş yapılamadı. Lütfen giriş yapmayı deneyin.',
      );
    }
    return this.fetchProfile(data.user.id);
  }

  async signIn(email: string, password: string): Promise<Profile> {
    validateSignIn(email, password);
    this.ensureConfigured();
    const { data, error } = await this.backend.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw AuthService.toAuthError(error);
    return this.fetchProfile(data.user.id);
  }

  /** Yalnızca bu telefondaki oturumu kapatır. İlaçlar ve hatırlatmalar cihazda kalır. */
  async signOut(): Promise<void> {
    this.ensureConfigured();
    const { error } = await this.backend.auth.signOut({ scope: 'local' });
    if (error) throw AuthService.toAuthError(error);
    await this.clearCachedProfile();
  }

  /** Şifre sıfırlama bağlantısı gönderir. Kayıtlı olmayan adres için de aynı yanıt döner. */
  async resetPassword(email: string): Promise<void> {
    validateEmail(email);
    this.ensureConfigured();
    const { error } = await this.backend.auth.resetPasswordForEmail(normalizeEmail(email));
    if (error) throw AuthService.toAuthError(error);
  }

  /** Cihazda kayıtlı oturum; internet gerektirmez. */
  async getSession(): Promise<Session | null> {
    if (!this.configured) return null;
    const { data, error } = await this.backend.auth.getSession();
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
      return await this.fetchProfile(session.user.id);
    } catch (error) {
      if (error instanceof AuthError && error.kind === 'offline') {
        const cached = await this.cachedProfile(session.user.id);
        if (cached) return cached;
      }
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
    const { error } = await this.backend
      .from('profiles')
      .update({ rol: role })
      .eq('id', session.user.id);
    if (error) throw AuthService.toAuthError(error);
    return this.fetchProfile(session.user.id);
  }

  /** Oturum açılınca, kapanınca veya yenilenince çağrılır. Dönen fonksiyon dinlemeyi bırakır. */
  onSessionChange(listener: (session: Session | null) => void): () => void {
    if (!this.configured) return () => {};
    const { data } = this.backend.auth.onAuthStateChange((_event, session) => listener(session));
    return () => data.subscription.unsubscribe();
  }

  /** Uygulama öndeyken oturum belirteci kendiliğinden yenilenir, arka plandayken durur. */
  setAutoRefresh(active: boolean) {
    if (!this.configured) return;
    if (active) void this.backend.auth.startAutoRefresh();
    else void this.backend.auth.stopAutoRefresh();
  }

  /** Supabase veya ağ hatasını kullanıcıya gösterilecek Türkçe mesajlı AuthError'a çevirir. */
  static toAuthError(error: unknown): AuthError {
    if (error instanceof AuthError) return error;
    const { name, code, status, message } = (error ?? {}) as ErrorLike;
    const text = typeof message === 'string' ? message : '';
    const technical = `${String(name ?? 'Hata')} ${String(code ?? '')}: ${text}`.trim();
    const make = (kind: AuthError['kind'], userMessage: string) =>
      new AuthError(kind, technical, userMessage, { cause: error });

    if (
      name === 'AuthRetryableFetchError' ||
      status === 0 ||
      /network request failed|failed to fetch|network ?error/i.test(text)
    ) {
      return make('offline', OFFLINE_MESSAGE);
    }
    switch (code) {
      case 'invalid_credentials':
        return make('invalid_credentials', 'E-posta adresi veya şifre yanlış.');
      case 'user_already_exists':
      case 'email_exists':
        return make(
          'email_taken',
          'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.',
        );
      case 'weak_password':
        return make(
          'weak_password',
          'Şifre çok zayıf. Harf ve rakam içeren, en az 8 karakterli bir şifre seçin.',
        );
      case 'email_address_invalid':
        return make('invalid_email', 'E-posta adresi geçerli değil.');
      case 'over_request_rate_limit':
      case 'over_email_send_rate_limit':
        return make(
          'rate_limited',
          'Çok fazla deneme yapıldı. Birkaç dakika sonra yeniden deneyin.',
        );
    }
    return make('unknown', 'Bir sorun oluştu. Lütfen biraz sonra yeniden deneyin.');
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

  private async fetchProfile(userId: string): Promise<Profile> {
    const { data, error } = await this.backend
      .from('profiles')
      .select('id, ad, rol, olusturma_zamani')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw AuthService.toAuthError(error);
    const profile = AuthService.profileOf(data as ProfileRow | null);
    if (!profile) {
      throw new AuthError(
        'profile_missing',
        `Profil bulunamadı veya bozuk: ${userId}`,
        'Hesap bilgileriniz bulunamadı. Lütfen çıkış yapıp yeniden giriş yapın.',
      );
    }
    await this.saveCachedProfile(profile);
    return profile;
  }

  private static profileOf(row: ProfileRow | null): Profile | null {
    if (!row || typeof row.ad !== 'string' || !isUserRole(row.rol)) return null;
    return { id: row.id, name: row.ad, role: row.rol, createdAt: row.olusturma_zamani };
  }

  private async cachedProfile(userId: string): Promise<Profile | null> {
    try {
      const raw = await this.cache.getItem(AuthService.PROFILE_CACHE_KEY);
      const parsed = raw === null ? null : safeJsonParse(raw);
      if (!parsed?.ok || !isRecord(parsed.value)) return null;
      const { id, name, role, createdAt } = parsed.value;
      if (id !== userId || typeof name !== 'string' || !isUserRole(role)) return null;
      return { id, name, role, createdAt: typeof createdAt === 'string' ? createdAt : '' };
    } catch (error) {
      logger.warn('Cihazdaki profil okunamadı:', error);
      return null;
    }
  }

  private async saveCachedProfile(profile: Profile) {
    try {
      await this.cache.setItem(AuthService.PROFILE_CACHE_KEY, JSON.stringify(profile));
    } catch (error) {
      // Kopya yazılamazsa yalnızca çevrimdışı açılış etkilenir; işlem durmaz.
      logger.warn('Profil cihaza yazılamadı:', error);
    }
  }

  private async clearCachedProfile() {
    try {
      await this.cache.removeItem(AuthService.PROFILE_CACHE_KEY);
    } catch (error) {
      logger.warn('Cihazdaki profil silinemedi:', error);
    }
  }
}
