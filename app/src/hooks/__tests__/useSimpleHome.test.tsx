import { act, renderHook, waitFor } from '@testing-library/react-native';

import { makeMedication } from '@/test-utils/fakes';
import { makeMedicationsHarness } from '@/test-utils/providers';

import { useSimpleHome } from '../useSimpleHome';

jest.mock('@/services', () => {
  const { DoseCalculator } = jest.requireActual('@/services/DoseCalculator');
  return { doseCalculator: new DoseCalculator() };
});
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));

const at = (hour: number, minute = 0) => new Date(2026, 10, 16, hour, minute);

async function setup(now: Date, medications = [makeMedication()]) {
  jest.useFakeTimers({ now });
  const harness = makeMedicationsHarness(medications, { now: () => now });
  const hook = await renderHook(() => useSimpleHome(), { wrapper: harness.wrapper });
  await waitFor(() => expect(hook.result.current.isLoaded).toBe(true));
  return { ...hook, ...harness };
}

afterEach(() => jest.useRealTimers());

describe('useSimpleHome', () => {
  it('saati gelen dozu, gecikmeyi, ilerlemeyi ve yarının ilk saatini verir', async () => {
    const { result } = await setup(at(8, 25));
    expect(result.current.focus?.time).toBe('08:00');
    expect(result.current.lateMinutes).toBe(25);
    expect(result.current.progress).toMatchObject({ total: 2, taken: 0 });
    expect(result.current.tomorrowFirstTime).toBe('08:00');
    expect(result.current.allTaken).toBe(false);
    expect(result.current.hasMedications).toBe(true);
  });

  it('onay kaydedilir, onay mesajı için ilacın adı tutulur', async () => {
    const { result, storage } = await setup(at(8, 5));
    await act(() => result.current.confirmFocus());
    expect(storage.doseLogs).toHaveLength(1);
    expect(result.current.lastTaken).toBe('Aspirin');
    expect(result.current.error).toBeNull();
    expect(result.current.focus?.time).toBe('20:00');
  });

  it('kayıt bitmeden gelen ikinci dokunuş dozu iki kez kaydetmez', async () => {
    const { result, storage } = await setup(at(8, 5));
    let finishSave = () => {};
    const repository = storage.doseLogRepository;
    const save = repository.recordDose.bind(repository);
    const spy = jest
      .spyOn(repository, 'recordDose')
      .mockImplementation(
        (...args) => new Promise((resolve) => (finishSave = () => resolve(save(...args)))),
      );

    await act(async () => {
      const first = result.current.confirmFocus();
      const second = result.current.confirmFocus();
      finishSave();
      await Promise.all([first, second]);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(storage.doseLogs).toHaveLength(1);
    expect(storage.medications[0]?.stock).toBe(9);
  });

  it('kayıt başarısızsa Türkçe hata verir', async () => {
    const { result, storage } = await setup(at(8, 5));
    storage.failWrites = true;
    await act(() => result.current.confirmFocus());
    expect(result.current.error).toBe('Kaydedilemedi. Lütfen tekrar deneyin.');
    expect(result.current.lastTaken).toBeNull();
  });

  it('gösterilecek doz yokken onay hiçbir şey yapmaz', async () => {
    const { result, storage } = await setup(at(9), []);
    expect(result.current.focus).toBeUndefined();
    expect(result.current.lateMinutes).toBe(0);
    await act(() => result.current.confirmFocus());
    expect(storage.saveCount).toBe(0);
  });
});
