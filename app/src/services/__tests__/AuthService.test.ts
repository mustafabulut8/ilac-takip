import { AuthError, ValidationError } from '@/errors';
import type { SignUpInput } from '@/models';

import { AuthService, type AuthBackend, type ProfileCache } from '../AuthService';

const USER_ID = 'kullanici-1';
const ROW = { id: USER_ID, ad: 'Ayşe', rol: 'sade', olusturma_zamani: '2026-11-26T08:00:00Z' };
const PROFILE = { id: USER_ID, name: 'Ayşe', role: 'sade', createdAt: '2026-11-26T08:00:00Z' };
const SESSION = { user: { id: USER_ID, email: 'ayse@mail.com' } };

const SIGN_UP: SignUpInput = {
  name: '  Ayşe ',
  email: ' Ayse@Mail.com ',
  password: 'gizli1234',
  role: 'sade',
  consent: true,
};

class MemoryCache implements ProfileCache {
  readonly items = new Map<string, string>();
  async getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  async removeItem(key: string) {
    this.items.delete(key);
  }
}

/** Supabase istemcisinin sahtesi: auth çağrıları ve `profiles` sorgusu. */
function makeBackend(row: unknown = ROW, rowError: unknown = null) {
  // select(...).eq(...).maybeSingle() profili okur; update(...).eq(...) sonucu hemen döner.
  let mode: 'select' | 'update' = 'select';
  type Query = Record<'select' | 'update' | 'eq' | 'maybeSingle', jest.Mock>;
  const query: Query = {
    select: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: row, error: rowError }),
  };
  query.select.mockImplementation(() => ((mode = 'select'), query));
  query.update.mockImplementation(() => ((mode = 'update'), query));
  query.eq.mockImplementation(() => (mode === 'update' ? Promise.resolve({ error: null }) : query));
  const unsubscribe = jest.fn();
  const auth = {
    signUp: jest
      .fn()
      .mockResolvedValue({ data: { user: SESSION.user, session: SESSION }, error: null }),
    signInWithPassword: jest
      .fn()
      .mockResolvedValue({ data: { user: SESSION.user, session: SESSION }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: SESSION }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe } } }),
    startAutoRefresh: jest.fn().mockResolvedValue(undefined),
    stopAutoRefresh: jest.fn().mockResolvedValue(undefined),
  };
  const from = jest.fn().mockReturnValue(query);
  return { backend: { auth, from } as unknown as AuthBackend, auth, from, query, unsubscribe };
}

function setup(row?: unknown, rowError?: unknown) {
  const mocks = makeBackend(row, rowError);
  const cache = new MemoryCache();
  const service = new AuthService(mocks.backend, cache);
  return { ...mocks, cache, service };
}

describe('AuthService.signUp', () => {
  it('e-postayı düzeltir, ad ve rolü metadata olarak gönderir, profili döner', async () => {
    const { service, auth, from, cache } = setup();
    await expect(service.signUp(SIGN_UP)).resolves.toEqual(PROFILE);
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'ayse@mail.com',
      password: 'gizli1234',
      options: { data: { ad: 'Ayşe', rol: 'sade' } },
    });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(JSON.parse(cache.items.get(AuthService.PROFILE_CACHE_KEY)!)).toEqual(PROFILE);
  });

  it('geçersiz bilgide sunucuya gitmeden ValidationError atar', async () => {
    const { service, auth } = setup();
    await expect(
      service.signUp({ ...SIGN_UP, password: 'kisa', consent: false }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('kayıtlı e-posta için Türkçe mesaj verir', async () => {
    const { service, auth } = setup();
    auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        name: 'AuthApiError',
        code: 'user_already_exists',
        status: 422,
        message: 'User already registered',
      },
    });
    const error = await service.signUp(SIGN_UP).catch((caught) => caught);
    expect(error).toBeInstanceOf(AuthError);
    expect(error.kind).toBe('email_taken');
    expect(error.userMessage).toBe(
      'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.',
    );
  });

  it('oturum açılmadıysa (e-posta doğrulaması açık) anlaşılır hata verir', async () => {
    const { service, auth } = setup();
    auth.signUp.mockResolvedValue({ data: { user: SESSION.user, session: null }, error: null });
    await expect(service.signUp(SIGN_UP)).rejects.toMatchObject({ kind: 'unknown' });
  });
});

describe('AuthService.signIn', () => {
  it('doğru bilgilerle profili döner', async () => {
    const { service, auth } = setup();
    await expect(service.signIn('AYSE@mail.com', 'gizli1234')).resolves.toEqual(PROFILE);
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ayse@mail.com',
      password: 'gizli1234',
    });
  });

  it('yanlış şifrede "E-posta adresi veya şifre yanlış." der', async () => {
    const { service, auth } = setup();
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        name: 'AuthApiError',
        code: 'invalid_credentials',
        status: 400,
        message: 'Invalid login credentials',
      },
    });
    await expect(service.signIn('ayse@mail.com', 'yanlis')).rejects.toMatchObject({
      kind: 'invalid_credentials',
      userMessage: 'E-posta adresi veya şifre yanlış.',
    });
  });

  it('profil satırı yoksa profile_missing hatası verir', async () => {
    const { service } = setup(null);
    await expect(service.signIn('ayse@mail.com', 'gizli1234')).rejects.toMatchObject({
      kind: 'profile_missing',
    });
  });

  it('boş şifreyi sunucuya göndermez', async () => {
    const { service, auth } = setup();
    await expect(service.signIn('ayse@mail.com', '')).rejects.toBeInstanceOf(ValidationError);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe('AuthService.signOut', () => {
  it('yalnızca bu cihazdaki oturumu kapatır ve profil kopyasını siler', async () => {
    const { service, auth, cache } = setup();
    await service.signIn('ayse@mail.com', 'gizli1234');
    await service.signOut();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(cache.items.has(AuthService.PROFILE_CACHE_KEY)).toBe(false);
  });
});

describe('AuthService.resetPassword', () => {
  it('düzeltilmiş e-postaya bağlantı ister', async () => {
    const { service, auth } = setup();
    await service.resetPassword(' Ayse@Mail.com');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('ayse@mail.com');
  });

  it('geçersiz e-postada ValidationError atar', async () => {
    const { service } = setup();
    await expect(service.resetPassword('ayse')).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('AuthService.currentProfile', () => {
  it('oturum yoksa null döner', async () => {
    const { service, auth } = setup();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(service.currentProfile()).resolves.toBeNull();
  });

  it('internet yoksa aynı kullanıcının cihazdaki profilini kullanır', async () => {
    const { service, query } = setup();
    await service.currentProfile();
    query.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'TypeError: Network request failed' },
    });
    await expect(service.currentProfile()).resolves.toEqual(PROFILE);
  });

  it('internet yoksa ve kopya başka kullanıcınınsa hatayı iletir', async () => {
    const { service, query, cache } = setup();
    cache.items.set(AuthService.PROFILE_CACHE_KEY, JSON.stringify({ ...PROFILE, id: 'baska' }));
    query.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Network request failed' },
    });
    await expect(service.currentProfile()).rejects.toMatchObject({ kind: 'offline' });
  });
});

describe('AuthService.updateRole', () => {
  it('rolü günceller ve yeni profili döner', async () => {
    const { service, query } = setup();
    query.maybeSingle.mockResolvedValue({ data: { ...ROW, rol: 'standart' }, error: null });
    await expect(service.updateRole('standart')).resolves.toMatchObject({ role: 'standart' });
    expect(query.update).toHaveBeenCalledWith({ rol: 'standart' });
  });
});

describe('AuthService yapılandırılmamışsa', () => {
  it('istek göndermez, anlaşılır hata verir; oturum null sayılır', async () => {
    const { backend, auth } = makeBackend();
    const service = new AuthService(backend, new MemoryCache(), false);
    await expect(service.signIn('ayse@mail.com', 'gizli1234')).rejects.toMatchObject({
      kind: 'not_configured',
    });
    await expect(service.getSession()).resolves.toBeNull();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(service.onSessionChange(jest.fn())).toEqual(expect.any(Function));
  });
});

describe('AuthService oturum olayları', () => {
  it('dinleyiciye oturumu iletir ve aboneliği bırakır', () => {
    const { service, auth, unsubscribe } = setup();
    const listener = jest.fn();
    const stop = service.onSessionChange(listener);
    auth.onAuthStateChange.mock.calls[0][0]('SIGNED_OUT', null);
    expect(listener).toHaveBeenCalledWith(null);
    stop();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('otomatik yenilemeyi uygulama öndeyken başlatır, arkadayken durdurur', () => {
    const { service, auth } = setup();
    service.setAutoRefresh(true);
    service.setAutoRefresh(false);
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService.toAuthError', () => {
  it.each([
    [{ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' }, 'offline'],
    [{ name: 'AuthWeakPasswordError', code: 'weak_password', status: 422 }, 'weak_password'],
    [{ code: 'email_exists', status: 422 }, 'email_taken'],
    [{ code: 'email_address_invalid', status: 400 }, 'invalid_email'],
    [{ code: 'over_request_rate_limit', status: 429 }, 'rate_limited'],
    [{ code: 'bilinmeyen', status: 500 }, 'unknown'],
    [new TypeError('Network request failed'), 'offline'],
    [undefined, 'unknown'],
  ])('%j → %s', (error, kind) => {
    const mapped = AuthService.toAuthError(error);
    expect(mapped).toBeInstanceOf(AuthError);
    expect(mapped.kind).toBe(kind);
    expect(mapped.userMessage).toMatch(/\S/);
  });

  it('internet yok mesajı Türkçedir', () => {
    expect(AuthService.toAuthError({ status: 0 }).userMessage).toBe(
      'İnternet bağlantısı yok. Bağlantınızı kontrol edip yeniden deneyin.',
    );
  });
});

// Karakterizasyon: AuthService bölünmeden önceki davranışı kilitler.
describe('AuthService.toAuthError (karakterizasyon)', () => {
  it.each([
    ['invalid_credentials', 'invalid_credentials', 'E-posta adresi veya şifre yanlış.'],
    [
      'user_already_exists',
      'email_taken',
      'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.',
    ],
    [
      'email_exists',
      'email_taken',
      'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.',
    ],
    [
      'weak_password',
      'weak_password',
      'Şifre çok zayıf. Harf ve rakam içeren, en az 8 karakterli bir şifre seçin.',
    ],
    ['email_address_invalid', 'invalid_email', 'E-posta adresi geçerli değil.'],
    [
      'over_request_rate_limit',
      'rate_limited',
      'Çok fazla deneme yapıldı. Birkaç dakika sonra yeniden deneyin.',
    ],
    [
      'over_email_send_rate_limit',
      'rate_limited',
      'Çok fazla deneme yapıldı. Birkaç dakika sonra yeniden deneyin.',
    ],
    ['bilinmeyen', 'unknown', 'Bir sorun oluştu. Lütfen biraz sonra yeniden deneyin.'],
  ])('%s kodu %s türüne ve Türkçe mesaja çevrilir', (code, kind, userMessage) => {
    const mapped = AuthService.toAuthError({ name: 'AuthApiError', code, message: 'm' });
    expect(mapped).toMatchObject({ kind, userMessage });
    expect(mapped.message).toBe(`AuthApiError ${code}: m`);
  });

  it('ağ hatası metinleri internet yok sayılır', () => {
    for (const message of ['Failed to fetch', 'NetworkError', 'network error']) {
      expect(AuthService.toAuthError({ message }).kind).toBe('offline');
    }
  });

  it('AuthError olduğu gibi döner, diğerlerinde asıl hata cause olarak saklanır', () => {
    const own = new AuthError('offline', 't', 'k');
    expect(AuthService.toAuthError(own)).toBe(own);
    const raw = { code: 'weak_password' };
    expect(AuthService.toAuthError(raw).cause).toBe(raw);
    expect(AuthService.toAuthError(null).message).toBe('Hata :');
  });
});

describe('AuthService profil kopyası (karakterizasyon)', () => {
  const offline = { data: null, error: { message: 'Network request failed' } };

  it('giriş profili cihaza yazar, çıkış siler', async () => {
    const { service, cache } = setup();
    await service.signIn('ayse@mail.com', 'gizli1234');
    expect(JSON.parse(cache.items.get(AuthService.PROFILE_CACHE_KEY)!)).toEqual(PROFILE);
    await service.signOut();
    expect(cache.items.has(AuthService.PROFILE_CACHE_KEY)).toBe(false);
  });

  it('bozuk, rolü geçersiz veya okunamayan kopya kullanılmaz', async () => {
    for (const raw of ['{bozuk', JSON.stringify({ ...PROFILE, role: 'yonetici' }), '[]']) {
      const { service, query, cache } = setup();
      cache.items.set(AuthService.PROFILE_CACHE_KEY, raw);
      query.maybeSingle.mockResolvedValue(offline);
      await expect(service.currentProfile()).rejects.toMatchObject({ kind: 'offline' });
    }
    const { service, query, cache } = setup();
    jest.spyOn(cache, 'getItem').mockRejectedValue(new Error('okunamadı'));
    query.maybeSingle.mockResolvedValue(offline);
    await expect(service.currentProfile()).rejects.toMatchObject({ kind: 'offline' });
  });

  it('kayıt anı olmayan kopya boş kayıt anıyla kullanılır', async () => {
    const { service, query, cache } = setup();
    const { createdAt: _createdAt, ...withoutDate } = PROFILE;
    cache.items.set(AuthService.PROFILE_CACHE_KEY, JSON.stringify(withoutDate));
    query.maybeSingle.mockResolvedValue(offline);
    await expect(service.currentProfile()).resolves.toEqual({ ...PROFILE, createdAt: '' });
  });

  it('kopya yazılamaz veya silinemezse işlem yine tamamlanır', async () => {
    const { service, cache } = setup();
    jest.spyOn(cache, 'setItem').mockRejectedValue(new Error('dolu'));
    jest.spyOn(cache, 'removeItem').mockRejectedValue(new Error('hata'));
    await expect(service.signIn('ayse@mail.com', 'gizli1234')).resolves.toEqual(PROFILE);
    await expect(service.signOut()).resolves.toBeUndefined();
  });

  it('sunucu hatası internet yok değilse kopyaya bakılmaz', async () => {
    const { service, query, cache } = setup();
    cache.items.set(AuthService.PROFILE_CACHE_KEY, JSON.stringify(PROFILE));
    query.maybeSingle.mockResolvedValue({ data: null, error: { code: 'bilinmeyen' } });
    await expect(service.currentProfile()).rejects.toMatchObject({ kind: 'unknown' });
  });
});
