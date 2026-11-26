import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { MedicationsProvider } from '@/context/medications';
import type { Medication } from '@/models';
import { DoseCalculator } from '@/services/DoseCalculator';
import { DoseService } from '@/services/DoseService';
import { FakeStorage, makeMedication } from '@/test-utils/fakes';

import SimpleHomeScreen from '@/app/sade';

// Ekran testleri: gerçek doz hesabı ve doz onayı, sahte depo. Bildirim, hesap ve
// yönlendirme sahtedir. Testler src/app altında değildir; Expo Router onları ekran sanardı.
jest.mock('@/services', () => {
  const { DoseCalculator: Calculator } = jest.requireActual('@/services/DoseCalculator');
  return { doseCalculator: new Calculator() };
});
jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ profile: { name: ' Ayşe  Yılmaz ' } }) }));
jest.mock('@/hooks/useNotificationPermission', () => ({
  useNotificationPermission: () => ({ status: 'granted', missing: false, request: jest.fn() }),
}));
jest.mock('@/hooks/useMedicationPhoto', () => ({ useMedicationPhoto: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

/** 16 Kasım 2026 Pazartesi, 08:10. */
const NOW = new Date(2026, 10, 16, 8, 10);

async function renderHome(medications: Medication[]) {
  jest.useFakeTimers({ now: NOW });
  const storage = new FakeStorage();
  storage.medications = medications;
  const doses = new DoseService(
    storage,
    { cancelSnooze: jest.fn().mockResolvedValue(undefined) },
    new DoseCalculator(),
    () => NOW,
  );
  const services = {
    medications: {
      load: () => storage.load(),
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    doses,
  };
  await render(
    <MedicationsProvider services={services}>
      <SimpleHomeScreen />
    </MedicationsProvider>,
  );
  await waitFor(() => expect(screen.getByText(/Günaydın/)).toBeTruthy());
  return storage;
}

afterEach(() => jest.useRealTimers());

describe('Sade ana ekran', () => {
  it('kullanıcıyı adıyla selamlar ve günü yazar', async () => {
    await renderHome([makeMedication()]);
    expect(screen.getByRole('header', { name: 'Günaydın Ayşe Yılmaz' })).toBeTruthy();
    expect(screen.getByText('16 Kasım Pazartesi')).toBeTruthy();
  });

  it('ilaç ekleme düğmesi yoktur; ilaç yoksa yakının ekleyeceğini söyler', async () => {
    await renderHome([]);
    expect(screen.queryByText(/İlaç ekle/)).toBeNull();
    expect(screen.queryByRole('button', { name: /ekle/i })).toBeNull();
    expect(screen.getByText('İlaçlarınızı yakınınız ekleyecek.')).toBeTruthy();
  });

  it('"Aldım"a basınca doz kaydedilir, stok düşer ve onay mesajı çıkar', async () => {
    const storage = await renderHome([makeMedication()]);
    expect(screen.getByText('Bugün 0 / 2 ilaç alındı')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Aspirin ilacını aldım' }));

    await waitFor(() => expect(screen.getByText('Aspirin alındı olarak kaydedildi.')).toBeTruthy());
    expect(storage.doseLogs).toEqual([
      expect.objectContaining({ id: 'ilac1_2026-11-16_08:00', date: '2026-11-16', time: '08:00' }),
    ]);
    expect(storage.medications[0]?.stock).toBe(9);
    expect(screen.getByText('Bugün 1 / 2 ilaç alındı')).toBeTruthy();
  });

  it('kayıt başarısızsa Türkçe hata gösterir', async () => {
    const storage = await renderHome([makeMedication()]);
    storage.failWrites = true;
    await fireEvent.press(screen.getByRole('button', { name: 'Aspirin ilacını aldım' }));
    await waitFor(() =>
      expect(screen.getByText('Kaydedilemedi. Lütfen tekrar deneyin.')).toBeTruthy(),
    );
  });

  it('bugünkü dozların hepsi alınınca tebrik ve yarının ilk saati', async () => {
    await renderHome([makeMedication({ times: ['08:00'] })]);
    await fireEvent.press(screen.getByRole('button', { name: 'Aspirin ilacını aldım' }));
    await waitFor(() =>
      expect(screen.getByText('Bugünkü ilaçlarınızın hepsini aldınız')).toBeTruthy(),
    );
    expect(screen.getByText('Yarın ilk ilacınız saat 08:00’da.')).toBeTruthy();
  });

  it('bugün başka doz yoksa bunu söyler', async () => {
    await renderHome([makeMedication({ schedule: { kind: 'weekdays', days: [2] } })]);
    expect(screen.getByText('Bugün için başka ilacınız yok.')).toBeTruthy();
  });
});
