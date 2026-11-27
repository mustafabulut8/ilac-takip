import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';

import ConnectFamilyScreen from '@/app/ailemi-bagla';
import NotificationPermissionScreen from '@/app/bildirim-izni';
import RedeemCodeScreen from '@/app/kodla-baglan';

const mockConsent = { status: 'granted' as string | null };
const mockInvite = { code: '482913' as string | null, busy: false, error: null, renew: jest.fn() };
const mockLinks = {
  links: [] as
    { id: string; personId: string; name: string; role: string; relationLabel: string }[] | null,
  error: null as string | null,
  remove: jest.fn(),
};
const mockRedeem = {
  redeem: jest.fn(),
  fieldErrors: {} as Record<string, string>,
  error: null as string | null,
  busy: false,
  clearField: jest.fn(),
};
const mockAuth = {
  homeRoute: '/aile',
  profile: { id: 'u1', name: 'Ayşe', role: 'aile' },
  finishOnboarding: jest.fn(),
};

jest.mock('@/hooks/useAuth', () => ({ useAuth: () => mockAuth }));
jest.mock('@/hooks/useConsent', () => ({ useConsent: () => mockConsent }));
jest.mock('@/hooks/useInviteCode', () => ({ useInviteCode: () => mockInvite }));
jest.mock('@/hooks/useCareLinks', () => ({ useCareLinks: () => mockLinks }));
jest.mock('@/hooks/useRedeemCode', () => ({ useRedeemCode: () => mockRedeem }));
jest.mock('@/hooks/useNow', () => ({ useNow: () => new Date(2026, 10, 27, 9, 0) }));
jest.mock('@/hooks/useNotificationPermission', () => ({
  useNotificationPermission: () => ({ request: jest.fn().mockResolvedValue(true) }),
}));
jest.mock('@/components/settings-button', () => ({ SettingsButton: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => false },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { router } = jest.requireMock('expo-router');
const FATMA = {
  id: 'l1',
  personId: 'p',
  name: 'Fatma Bulut',
  role: 'sade',
  relationLabel: 'Annem',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockConsent.status = 'granted';
  mockLinks.links = [];
  mockLinks.remove.mockResolvedValue(undefined);
  mockRedeem.fieldErrors = {};
  mockRedeem.error = null;
  mockAuth.profile = { id: 'u1', name: 'Ayşe', role: 'aile' };
});

describe('Ailemi Bağla', () => {
  it('kodu üçer rakamla, geçerlilik süresiyle gösterir; paylaş ve yeni kod çalışır', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(<ConnectFamilyScreen />);
    expect(screen.getByText('482 913')).toBeTruthy();
    expect(screen.getByText('Kod 24 saat geçerlidir')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Kodu paylaş' }));
    expect(share.mock.calls[0]?.[0].message).toContain('482 913');
    await fireEvent.press(screen.getByRole('button', { name: 'Yeni kod al' }));
    expect(mockInvite.renew).toHaveBeenCalled();
  });

  it('rıza yoksa kod yerine açıklama ve rıza ekranına giden düğme görünür', async () => {
    mockConsent.status = 'declined';
    await render(<ConnectFamilyScreen />);
    expect(screen.queryByText('482 913')).toBeNull();
    expect(screen.getByText('Yakınınızı bağlamak için sağlık verisi rızası gerekir.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Rıza ekranını aç' }));
    expect(router.push).toHaveBeenCalledWith('/saglik-verisi-rizasi');
  });

  it('bağlı yakını onayla kaldırır', async () => {
    mockLinks.links = [{ ...FATMA, name: 'Ayşe Bulut', role: 'aile' }];
    await render(<ConnectFamilyScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Ayşe Bulut bağlantısını kaldır' }));
    expect(screen.getByText('Bağlantıyı kaldırmak istiyor musunuz?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Bağlantıyı kaldır' }));
    await waitFor(() => expect(mockLinks.remove).toHaveBeenCalledWith('l1'));
  });
});

describe('Kodla Bağlan', () => {
  it('kodu ve seçilen yakınlığı gönderir; bağlanınca Aile Paneli açılır', async () => {
    mockRedeem.redeem.mockResolvedValue({ patientId: 'p', patientName: 'Fatma' });
    await render(<RedeemCodeScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('482 913'), '482 913');
    await fireEvent.press(screen.getByRole('button', { name: 'Annem' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Bağlan' }));
    expect(mockRedeem.redeem).toHaveBeenCalledWith({ code: '482913', relationLabel: 'Annem' });
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/aile'));
  });

  it('"Diğer" seçilince yakınlık yazılır', async () => {
    mockRedeem.redeem.mockResolvedValue(null);
    await render(<RedeemCodeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Diğer' }));
    await fireEvent.changeText(screen.getByPlaceholderText('Örneğin: Teyzem'), 'Teyzem');
    await fireEvent.press(screen.getByRole('button', { name: 'Bağlan' }));
    expect(mockRedeem.redeem).toHaveBeenCalledWith({ code: '', relationLabel: 'Teyzem' });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sunucunun Türkçe hatasını gösterir', async () => {
    mockRedeem.error = 'Kod geçersiz veya süresi dolmuş. Yakınınızdan yeni kod isteyin.';
    await render(<RedeemCodeScreen />);
    expect(screen.getByText(mockRedeem.error)).toBeTruthy();
  });
});

describe('Kayıttan sonra (bildirim izni)', () => {
  it('aile rolünde ilk iş yakınını bağlamaktır', async () => {
    await render(<NotificationPermissionScreen />);
    await fireEvent.press(screen.getByRole('link', { name: 'Şimdi değil' }));
    expect(mockAuth.finishOnboarding).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/kodla-baglan');
  });

  it('sade rolünde ana ekrana (rıza adımına) bırakılır', async () => {
    mockAuth.profile = { id: 'u1', name: 'Ayşe', role: 'sade' };
    await render(<NotificationPermissionScreen />);
    await fireEvent.press(screen.getByRole('link', { name: 'Şimdi değil' }));
    expect(router.replace).not.toHaveBeenCalled();
  });
});
