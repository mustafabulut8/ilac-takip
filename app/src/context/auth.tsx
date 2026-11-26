import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { userMessageOf } from '@/errors';
import type { Profile, SignUpInput, UserRole } from '@/models';
import { authService as defaultAuthService, type AuthService } from '@/services';
import { logger } from '@/utils/logger';
import { homeRouteOf, type HomeRoute } from '@/utils/routes';

type AuthContextValue = {
  /** Cihazdaki oturum okunana kadar true; bu sırada açılış ekranı açık kalır. */
  isLoading: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Profil alınamadıysa kullanıcıya gösterilecek mesaj. */
  profileError: string | null;
  /** Yeni kayıttan sonra Bildirim İzni ekranı gösterilecek mi? */
  onboarding: boolean;
  /** Kullanıcının o anki ana ekranı (rol seçimi, Sade, Bugün, Aile). */
  homeRoute: HomeRoute;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  retryProfile: () => Promise<void>;
  finishOnboarding: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Sağlayıcının AuthService'ten kullandığı metotlar; testte sahtesi verilir. */
export type AuthSessionService = Pick<
  AuthService,
  | 'getSession'
  | 'currentProfile'
  | 'onSessionChange'
  | 'setAutoRefresh'
  | 'signUp'
  | 'signIn'
  | 'signOut'
  | 'resetPassword'
  | 'updateRole'
>;

/**
 * Oturum ve profilin React durumu. İş kuralı AuthService'tedir; bu bileşen
 * servisi çağırır ve oturum değişikliklerini dinler.
 */
export function AuthProvider({
  children,
  service = defaultAuthService,
}: {
  children: ReactNode;
  service?: AuthSessionService;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  // Aynı kullanıcı için profil yeniden istenmesin (belirteç yenilenince de olay gelir).
  const profileUserId = useRef<string | null>(null);

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const next = await service.currentProfile();
      profileUserId.current = next?.id ?? null;
      setProfile(next);
    } catch (error) {
      logger.error('Profil alınamadı:', error);
      setProfileError(userMessageOf(error, 'Hesap bilgileriniz alınamadı.'));
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    service
      .getSession()
      .then(async (stored) => {
        if (!active) return;
        setSession(stored);
        if (stored) await loadProfile();
      })
      .finally(() => active && setIsLoading(false));

    const unsubscribe = service.onSessionChange((next) => {
      setSession(next);
      if (!next) {
        profileUserId.current = null;
        setProfile(null);
        setOnboarding(false);
      }
    });

    // Supabase'in önerdiği gibi: belirteç yalnızca uygulama öndeyken yenilenir.
    service.setAutoRefresh(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) =>
      service.setAutoRefresh(state === 'active'),
    );

    return () => {
      active = false;
      unsubscribe();
      subscription.remove();
    };
    // loadProfile her çizimde yeniden oluşur; abonelik yalnızca servis değişince kurulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const acceptProfile = (next: Profile) => {
    profileUserId.current = next.id;
    setProfileError(null);
    setProfile(next);
  };

  const signUp = async (input: SignUpInput) => {
    // Profil gelir gelmez ana ekran yerine Bildirim İzni açılsın diye önce işaretlenir.
    setOnboarding(true);
    setProfileLoading(true);
    try {
      acceptProfile(await service.signUp(input));
    } catch (error) {
      setOnboarding(false);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setProfileLoading(true);
    try {
      acceptProfile(await service.signIn(email, password));
    } finally {
      setProfileLoading(false);
    }
  };

  const signOut = async () => {
    await service.signOut();
    profileUserId.current = null;
    setProfile(null);
    setSession(null);
    setOnboarding(false);
  };

  const updateRole = async (role: UserRole) => {
    acceptProfile(await service.updateRole(role));
  };

  const homeRoute = homeRouteOf({
    hasSession: !!session,
    role: profile?.role ?? null,
    profileLoading: profileLoading || (!!session && !profile && !profileError),
    onboarding,
  });

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        session,
        profile,
        profileError,
        onboarding,
        homeRoute,
        signUp,
        signIn,
        signOut,
        resetPassword: (email) => service.resetPassword(email),
        updateRole,
        retryProfile: loadProfile,
        finishOnboarding: () => setOnboarding(false),
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  }
  return value;
}
