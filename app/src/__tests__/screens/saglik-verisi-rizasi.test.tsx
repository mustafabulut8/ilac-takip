import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import HealthConsentScreen from '@/app/saglik-verisi-rizasi';
import { makeMedication } from '@/test-utils/fakes';

const mockConsent = { grant: jest.fn(), decline: jest.fn() };
let mockMedications = [makeMedication(), makeMedication({ id: 'ilac2' })];

jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ homeRoute: '/sade' }) }));
jest.mock('@/hooks/useConsent', () => ({ useConsent: () => mockConsent }));
jest.mock('@/hooks/useMedications', () => ({
  useMedications: () => ({ medications: mockMedications }),
}));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: () => false },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Sağlık verisi rızası ekranı', () => {
  beforeEach(() => {
    mockConsent.grant.mockReset().mockResolvedValue(undefined);
    mockConsent.decline.mockReset().mockResolvedValue(undefined);
    mockMedications = [makeMedication(), makeMedication({ id: 'ilac2' })];
  });

  it('nereye, kimin göreceğini ve geri almayı yazar; telefondaki ilaç sayısını söyler', async () => {
    await render(<HealthConsentScreen />);
    expect(screen.getByText('İlaç bilgileriniz hesabınızda saklansın mı?')).toBeTruthy();
    expect(screen.getByText("Supabase sunucusunda, Avrupa Birliği'nde (İrlanda).")).toBeTruthy();
    expect(screen.getByText('Nasıl geri alırım')).toBeTruthy();
    expect(
      screen.getByText('Telefonunuzdaki 2 ilaç ve doz geçmişi hesabınıza yüklenecek.'),
    ).toBeTruthy();
  });

  it('telefonda ilaç yoksa yükleme cümlesi çıkmaz', async () => {
    mockMedications = [];
    await render(<HealthConsentScreen />);
    expect(screen.queryByText(/hesabınıza yüklenecek/)).toBeNull();
  });

  it('"Kabul ediyorum" rızayı kaydeder ve ana ekrana döner', async () => {
    const { router } = jest.requireMock('expo-router');
    await render(<HealthConsentScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Kabul ediyorum' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/sade'));
    expect(mockConsent.grant).toHaveBeenCalled();
  });

  it('"Şimdilik hayır" yalnızca telefonda devam eder; hata olursa ekranda kalır', async () => {
    mockConsent.decline.mockRejectedValue(new Error('x'));
    await render(<HealthConsentScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Şimdilik hayır' }));
    expect(await screen.findByText('Bir sorun oluştu. Lütfen yeniden deneyin.')).toBeTruthy();
  });
});
