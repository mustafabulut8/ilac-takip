import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import { AuthError } from '@/errors';
import type { Profile } from '@/models';

import { AuthProvider, useAuth } from '../auth';

jest.mock('@/services', () => ({}));

const SESSION = { user: { id: 'u1' } };
const SADE: Profile = { id: 'u1', name: 'Ayşe', role: 'sade', createdAt: '' };

function fakeService(session: unknown = SESSION) {
  let emit: (session: unknown) => void = () => {};
  const service = {
    getSession: jest.fn().mockResolvedValue(session),
    currentProfile: jest.fn().mockResolvedValue(session ? SADE : null),
    onSessionChange: jest.fn((listener: (session: unknown) => void) => {
      emit = listener;
      return jest.fn();
    }),
    setAutoRefresh: jest.fn(),
    signUp: jest.fn().mockResolvedValue({ ...SADE, role: 'standart' }),
    signIn: jest.fn().mockResolvedValue(SADE),
    signOut: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    updateRole: jest.fn().mockResolvedValue({ ...SADE, role: 'aile' }),
  };
  return { service, emit: (next: unknown) => emit(next) };
}

async function setup(fake = fakeService()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider service={fake.service}>{children}</AuthProvider>
  );
  const hook = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return { ...hook, ...fake };
}

describe('AuthProvider', () => {
  it('oturum yoksa rol seçimi (hoş geldiniz) açılır', async () => {
    const { result, service } = await setup(fakeService(null));
    expect(result.current.homeRoute).toBe('/hos-geldiniz');
    expect(service.currentProfile).not.toHaveBeenCalled();
  });

  it('oturum varsa profili yükler ve role göre ana ekranı seçer', async () => {
    const { result } = await setup();
    await waitFor(() => expect(result.current.profile).toEqual(SADE));
    expect(result.current.homeRoute).toBe('/sade');
  });

  it('profil alınamazsa hata mesajı ve hata ekranı; yeniden denenebilir', async () => {
    const fake = fakeService();
    fake.service.currentProfile.mockRejectedValueOnce(
      new AuthError('offline', 't', 'İnternet bağlantısı yok.'),
    );
    const { result } = await setup(fake);
    await waitFor(() => expect(result.current.profileError).toBe('İnternet bağlantısı yok.'));
    expect(result.current.homeRoute).toBe('/profil-hatasi');

    await act(() => result.current.retryProfile());
    expect(result.current.profileError).toBeNull();
    expect(result.current.homeRoute).toBe('/sade');
  });

  it('oturum süresi dolunca (oturum kapandı olayı) profil silinir, rol seçimine dönülür', async () => {
    const { result, emit } = await setup();
    await waitFor(() => expect(result.current.homeRoute).toBe('/sade'));
    await act(async () => emit(null));
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.homeRoute).toBe('/hos-geldiniz');
  });

  it('kayıttan sonra önce Bildirim İzni, bitince role göre ana ekran', async () => {
    const { result, emit } = await setup(fakeService(null));
    await act(async () => {
      emit(SESSION);
      await result.current.signUp({} as never);
    });
    expect(result.current.homeRoute).toBe('/bildirim-izni');
    await act(async () => result.current.finishOnboarding());
    expect(result.current.homeRoute).toBe('/');
  });

  it('kayıt başarısızsa Bildirim İzni işareti kalkar ve hata iletilir', async () => {
    const fake = fakeService(null);
    fake.service.signUp.mockRejectedValue(new Error('hata'));
    const { result } = await setup(fake);
    await act(async () => {
      await expect(result.current.signUp({} as never)).rejects.toThrow('hata');
    });
    expect(result.current.onboarding).toBe(false);
  });

  it('giriş, rol değiştirme, şifre sıfırlama ve çıkış servise iletilir', async () => {
    const { result, service, emit } = await setup(fakeService(null));
    await act(async () => {
      emit(SESSION);
      await result.current.signIn('a@b.co', 'gizli1234');
    });
    expect(result.current.homeRoute).toBe('/sade');

    await act(() => result.current.updateRole('aile'));
    expect(result.current.homeRoute).toBe('/aile');

    await act(() => result.current.resetPassword('a@b.co'));
    expect(service.resetPassword).toHaveBeenCalledWith('a@b.co');

    await act(() => result.current.signOut());
    expect(result.current.profile).toBeNull();
    expect(result.current.homeRoute).toBe('/hos-geldiniz');
  });

  it('belirteç yenileme yalnızca uygulama öndeyken açıktır', async () => {
    let onChange: (state: string) => void = () => {};
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onChange = listener as (state: string) => void;
      return { remove: jest.fn() };
    });
    const { service } = await setup();
    await act(async () => onChange('background'));
    expect(service.setAutoRefresh).toHaveBeenLastCalledWith(false);
    await act(async () => onChange('active'));
    expect(service.setAutoRefresh).toHaveBeenLastCalledWith(true);
  });

  it('sağlayıcı dışında kullanılınca anlaşılır hata verir', async () => {
    await expect(renderHook(() => useAuth())).rejects.toThrow(
      'useAuth, AuthProvider içinde kullanılmalıdır.',
    );
  });
});
