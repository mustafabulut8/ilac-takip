import type { UserRole } from '@/models';

/** Oturum ve role göre açılan ana ekranlar. */
export const HOME_ROUTES = {
  guest: '/hos-geldiniz',
  onboarding: '/bildirim-izni',
  noProfile: '/profil-hatasi',
  sade: '/sade',
  standart: '/',
  aile: '/aile',
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
