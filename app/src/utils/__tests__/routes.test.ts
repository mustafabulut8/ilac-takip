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
