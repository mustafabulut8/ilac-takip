import type { UserRole } from '@/models';

/** Oturum ve role göre açılan ana ekranlar. */
export const HOME_ROUTES = {
  guest: '/hos-geldiniz',
  onboarding: '/bildirim-izni',
  noProfile: '/profil-hatasi',
  sade: '/sade',
  standart: '/',
  aile: '/aile',
  consent: '/saglik-verisi-rizasi',
} as const;

export type HomeRoute = (typeof HOME_ROUTES)[keyof typeof HOME_ROUTES];

export type AuthRouteState = {
  /** Cihazda oturum var mı? */
  hasSession: boolean;
  /** Profil yüklendiyse rolü. */
  role: UserRole | null;
  /** Profil hâlâ yükleniyor mu? */
  profileLoading: boolean;
  /** Yeni kayıt olundu, bildirim izni ekranı henüz geçilmedi. */
  onboarding: boolean;
};

/**
 * Kullanıcının ana ekranı. Oturum yoksa rol seçimi; profil yüklenirken giriş
 * ekranında kalınır; profil hiç alınamadıysa hata ekranı açılır.
 */
export function homeRouteOf({
  hasSession,
  role,
  profileLoading,
  onboarding,
}: AuthRouteState): HomeRoute {
  if (!hasSession || (!role && profileLoading)) return HOME_ROUTES.guest;
  if (!role) return HOME_ROUTES.noProfile;
  if (onboarding) return HOME_ROUTES.onboarding;
  return HOME_ROUTES[role];
}

/** Telefondaki rıza durumu; `null`: henüz okunmadı. */
export type ConsentStep = 'granted' | 'declined' | 'withdrawn' | 'none' | null;

/**
 * Sağlık verisi rızası bir kez sorulur (kararlar.md ADR-021): sade ve standart
 * kullanıcı, bildirim izninden sonra ve hiç cevap vermediyse ana ekranından önce rıza
 * ekranını görür. Durum henüz okunmadıysa beklenmez; ana ekran açılır.
 */
export function withConsentStep(route: HomeRoute, consent: ConsentStep): HomeRoute {
  const asks = route === HOME_ROUTES.sade || route === HOME_ROUTES.standart;
  return asks && consent === 'none' ? HOME_ROUTES.consent : route;
}
