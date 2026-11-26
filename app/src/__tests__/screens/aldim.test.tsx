import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import TakeDoseScreen from '@/app/aldim/[id]';
import { makeMedication } from '@/test-utils/fakes';
import { makeMedicationsHarness } from '@/test-utils/providers';

// İlaç zamanı ekranı: gerçek doz hesabı ve onay, sahte depo; erteleme ve fotoğraf sahte.
jest.mock('@/services', () => {
  const { DoseCalculator } = jest.requireActual('@/services/DoseCalculator');
  return { doseCalculator: new DoseCalculator() };
});
jest.mock('@/hooks/useSnooze', () => ({
  useSnooze: () => ({ isSnoozed: false, error: null, snooze: jest.fn() }),
}));
jest.mock('@/hooks/useMedicationPhoto', () => ({ useMedicationPhoto: () => null }));
jest.mock('expo-router', () => ({
  router: { canGoBack: () => true, back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'ilac1', time: '08:00', date: '2026-11-16' }),
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const NOW = new Date(2026, 10, 16, 8, 10);

async function renderScreen() {
  jest.useFakeTimers({ now: NOW });
  const harness = makeMedicationsHarness([makeMedication()], { now: () => NOW });
  await render(<TakeDoseScreen />, { wrapper: harness.wrapper });
  await waitFor(() => expect(screen.getByText('Aspirin')).toBeTruthy());
  return harness;
}

afterEach(() => jest.useRealTimers());

describe('İlaç zamanı ekranı', () => {
  it('"Aldım" dozu kaydeder, stoğu düşürür, titreşir ve tamamlandı ekranını açar', async () => {
    const { storage } = await renderScreen();
    await fireEvent.press(screen.getByLabelText('Aspirin ilacını aldım'));
    await waitFor(() => expect(screen.getByText('Tamamlandı')).toBeTruthy());
    expect(storage.doseLogs).toHaveLength(1);
    expect(storage.medications[0]?.stock).toBe(9);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('kaydedilemezse Türkçe hata gösterir ve ekranda kalır', async () => {
    const { storage } = await renderScreen();
    storage.failWrites = true;
    await fireEvent.press(screen.getByLabelText('Aspirin ilacını aldım'));
    await waitFor(() =>
      expect(screen.getByText('Kaydedilemedi. Lütfen tekrar deneyin.')).toBeTruthy(),
    );
    expect(screen.queryByText('Tamamlandı')).toBeNull();
    await act(async () => {});
  });
});
