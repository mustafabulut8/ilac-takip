import { HOME_ROUTES, homeRouteOf } from '../routes';

const base = { hasSession: true, role: null, profileLoading: false, onboarding: false };

describe('homeRouteOf', () => {
  it('oturum yoksa rol seçimini açar', () => {
    expect(homeRouteOf({ ...base, hasSession: false, role: 'sade' })).toBe(HOME_ROUTES.guest);
  });

  it('profil yüklenirken giriş ekranlarında kalır', () => {
    expect(homeRouteOf({ ...base, profileLoading: true })).toBe(HOME_ROUTES.guest);
  });

  it('profil alınamadıysa hata ekranını açar', () => {
    expect(homeRouteOf(base)).toBe(HOME_ROUTES.noProfile);
  });

  it('role göre ana ekranı seçer', () => {
    expect(homeRouteOf({ ...base, role: 'sade' })).toBe('/sade');
    expect(homeRouteOf({ ...base, role: 'standart' })).toBe('/');
    expect(homeRouteOf({ ...base, role: 'aile' })).toBe('/aile');
  });

  it('yeni kayıttan sonra önce bildirim izni ekranı gelir', () => {
    expect(homeRouteOf({ ...base, role: 'aile', onboarding: true })).toBe('/bildirim-izni');
  });
});

describe('homeRouteOf: bütün birleşimler', () => {
  const roles = [null, 'sade', 'standart', 'aile'] as const;
  const flags = [false, true];
  const cases = flags.flatMap((hasSession) =>
    roles.flatMap((role) =>
      flags.flatMap((profileLoading) =>
        flags.map((onboarding) => ({ hasSession, role, profileLoading, onboarding })),
      ),
    ),
  );

  /** Kuralların düz anlatımı: öncelik sırası oturum → profil → izin ekranı → rol. */
  const expected = ({ hasSession, role, profileLoading, onboarding }: (typeof cases)[number]) => {
    if (!hasSession) return '/hos-geldiniz';
    if (role === null) return profileLoading ? '/hos-geldiniz' : '/profil-hatasi';
    if (onboarding) return '/bildirim-izni';
    return { sade: '/sade', standart: '/', aile: '/aile' }[role];
  };

  it.each(cases)('%o', (state) => {
    expect(homeRouteOf(state)).toBe(expected(state));
  });

  it('önbellekteki profil varken yükleme sürse de rolün ekranı açılır (çevrimdışı açılış)', () => {
    expect(homeRouteOf({ ...base, role: 'sade', profileLoading: true })).toBe('/sade');
  });
});
