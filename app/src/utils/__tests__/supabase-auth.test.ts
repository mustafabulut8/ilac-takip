import { authOptionsFor, isServerEnvironment } from '../supabase-auth';

const storage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };

describe('authOptionsFor (Supabase oturum ayarları)', () => {
  it('telefonda oturum depoda saklanır ve kendiliğinden yenilenir', () => {
    expect(authOptionsFor(false, storage)).toEqual({
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    });
  });

  it('sunucu dışa aktarımında (window yok) depo kullanılmaz, oturum saklanmaz ve yenilenmez', () => {
    expect(authOptionsFor(true, storage)).toEqual({
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    });
  });
});

describe('isServerEnvironment', () => {
  it('window yoksa sunucu ortamıdır', () => {
    expect(isServerEnvironment({})).toBe(true);
    expect(isServerEnvironment({ window: {} })).toBe(false);
  });
});
