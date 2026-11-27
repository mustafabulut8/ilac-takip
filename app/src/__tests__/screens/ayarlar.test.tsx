import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SettingsScreen from '@/app/ayarlar';

const mockSignOut = jest.fn();
const mockAuth = {
  profile: { id: 'u1', name: 'ayşe', role: 'sade', createdAt: '' } as {
    id: string;
    name: string;
    role: string;
    createdAt: string;
  } | null,
  session: { user: { email: 'ayse@mail.com' } } as { user: { email: string } } | null,
  homeRoute: '/sade',
  signOut: mockSignOut,
};
const mockPermission = { status: 'granted', missing: false, request: jest.fn() };

const mockConsent = {
  status: 'granted' as string | null,
  at: '2026-11-27T09:00:00.000Z' as string | null,
  withdraw: jest.fn(),
};

jest.mock('@/hooks/useAuth', () => ({ useAuth: () => mockAuth }));
jest.mock('@/hooks/useConsent', () => ({ useConsent: () => mockConsent }));
jest.mock('@/hooks/useNotificationPermission', () => ({
  useNotificationPermission: () => mockPermission,
}));
jest.mock('@/components/test-notification-button', () => ({ TestNotificationButton: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.2.3' } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Karakterizasyon: Ayarlar ekranı bölünmeden önce.
describe('Ayarlar ekranı', () => {
  beforeEach(() => {
    mockSignOut.mockReset().mockResolvedValue(undefined);
    mockPermission.missing = false;
  });

  it('adı, baş harfi, e-postayı, kullanım biçimini ve sürümü gösterir', async () => {
    await render(<SettingsScreen />);
    expect(screen.getByText('ayşe')).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('ayse@mail.com')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kullanım biçimi, Sade kullanım' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bildirimler, Açık' })).toBeTruthy();
    expect(screen.getByText('Sürüm 1.2.3')).toBeTruthy();
  });

  it('bildirim izni kapalıysa "Kapalı" yazar; profil yoksa "Hesap" der', async () => {
    mockPermission.missing = true;
    const saved = { profile: mockAuth.profile, session: mockAuth.session };
    mockAuth.profile = null;
    mockAuth.session = null;
    await render(<SettingsScreen />);
    expect(screen.getByRole('button', { name: 'Bildirimler, Kapalı' })).toBeTruthy();
    expect(screen.getByText('Hesap')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kullanım biçimi' })).toBeTruthy();
    Object.assign(mockAuth, saved);
  });

  it('çıkış onaylanınca oturum kapanır', async () => {
    await render(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Çıkış yap' }));
    expect(screen.getByText('Çıkış yapmak istiyor musunuz?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Evet, çıkış yap' }));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  });
});

describe('Ayarlar: sağlık verisi ve aile', () => {
  beforeEach(() => {
    mockAuth.profile = { id: 'u1', name: 'ayşe', role: 'sade', createdAt: '' };
    mockConsent.status = 'granted';
    mockConsent.withdraw.mockReset().mockResolvedValue(undefined);
  });

  it('rıza verildiyse tarihini gösterir; geri alma penceresi telefondaki verinin kaldığını söyler', async () => {
    await render(<SettingsScreen />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Sağlık verisi rızası, Verildi · 27 Kasım 2026' }),
    );
    expect(screen.getByText('Rızanızı geri almak istiyor musunuz?')).toBeTruthy();
    expect(
      screen.getByText(
        'Sunucudaki ilaç bilgileriniz ve aile bağlantılarınız silinecek. Telefonunuzdaki ilaçlar ve hatırlatmalar devam eder.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Rızamı geri al' }));
    await waitFor(() => expect(mockConsent.withdraw).toHaveBeenCalled());
  });

  it('rıza yoksa satır rıza ekranını açar, aile bağlama "rıza gerekir" diye pasif görünür', async () => {
    const { router } = jest.requireMock('expo-router');
    mockConsent.status = 'declined';
    await render(<SettingsScreen />);
    expect(
      screen.getByRole('button', { name: 'Ailemi bağla, Bunun için rıza gerekir, Yakında' }),
    ).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Sağlık verisi rızası, Verilmedi' }));
    expect(router.push).toHaveBeenCalledWith('/saglik-verisi-rizasi');
  });

  it('aile rolünde bu bölüm görünmez', async () => {
    mockAuth.profile = { id: 'u1', name: 'ayşe', role: 'aile', createdAt: '' };
    await render(<SettingsScreen />);
    expect(screen.queryByText('Sağlık verisi rızası')).toBeNull();
  });
});
