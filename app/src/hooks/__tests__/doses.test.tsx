import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { StorageError } from '@/errors';
import { doseLogIdOf, type DoseLog } from '@/models';
import { makeMedication } from '@/test-utils/fakes';
import { makeMedicationsHarness } from '@/test-utils/providers';

import { useAuth } from '../useAuth';
import { useDose } from '../useDose';
import { useHistoryWeek } from '../useHistoryWeek';
import { useMedicationList } from '../useMedicationList';
import { useNotice } from '../useNotice';
import { useNow } from '../useNow';
import { useTodayDoses } from '../useTodayDoses';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@/services', () => {
  const { DoseCalculator } = jest.requireActual('@/services/DoseCalculator');
  const { HistoryService } = jest.requireActual('@/services/HistoryService');
  const doseCalculator = new DoseCalculator();
  return { doseCalculator, historyService: new HistoryService(doseCalculator) };
});

/** 18 Kasım 2026 Çarşamba. */
const at = (hour: number, minute = 0, day = 18) => new Date(2026, 10, day, hour, minute);
const taken = (date: string, time: string): DoseLog => ({
  id: doseLogIdOf('ilac1', date, time),
  medicationId: 'ilac1',
  date,
  time,
  takenAt: `${date}T05:00:00.000Z`,
});

async function setup<T>(
  hook: () => T,
  now: Date,
  { medications = [makeMedication()], doseLogs = [] as DoseLog[] } = {},
) {
  jest.useFakeTimers({ now });
  const harness = makeMedicationsHarness(medications, { doseLogs, now: () => now });
  const rendered = await renderHook(hook, { wrapper: harness.wrapper });
  await act(async () => {});
  return { ...rendered, ...harness };
}

afterEach(() => jest.useRealTimers());

describe('useTodayDoses', () => {
  it('bugünün dozlarını, gruplarını, ilerlemeyi ve sıradaki dozu verir', async () => {
    const { result } = await setup(() => useTodayDoses(), at(9), {
      doseLogs: [taken('2026-11-18', '08:00')],
    });
    expect(result.current.doses.map((dose) => dose.status)).toEqual(['alindi', 'bekliyor']);
    expect(result.current.groups.map((group) => group.period)).toEqual(['morning', 'evening']);
    expect(result.current.progress).toMatchObject({ total: 2, taken: 1, percent: 50 });
    expect(result.current.nextDose?.time).toBe('20:00');
  });
});

describe('useDose', () => {
  it('dozun ilacını, onay durumunu ve sıradaki dozu verir; onaylar', async () => {
    const { result, storage } = await setup(() => useDose('ilac1', '2026-11-18', '08:00'), at(8));
    expect(result.current.medication?.name).toBe('Aspirin');
    expect(result.current.isTaken).toBe(false);
    expect(result.current.nextDose?.time).toBe('08:00');

    await act(() => result.current.confirm());
    expect(storage.doseLogs).toHaveLength(1);
    expect(result.current.isTaken).toBe(true);
    expect(result.current.takenAt).toBe(at(8).toISOString());
  });

  it('ilaç veya saat yoksa onay hiçbir şey yazmaz', async () => {
    const missing = await setup(() => useDose('yok', '2026-11-18', '08:00'), at(8));
    await act(() => missing.result.current.confirm());
    expect(missing.result.current.medication).toBeUndefined();
    jest.useRealTimers();

    const noTime = await setup(() => useDose('ilac1', '2026-11-18', undefined), at(8));
    await act(() => noTime.result.current.confirm());
    expect(noTime.storage.saveCount).toBe(0);
  });
});

describe('useHistoryWeek', () => {
  it('bu haftayı açar, bugünü seçer; ileri gidilemez', async () => {
    const { result } = await setup(() => useHistoryWeek(), at(9), {
      doseLogs: [taken('2026-11-17', '08:00')],
    });
    expect(result.current.today).toBe('2026-11-18');
    expect(result.current.selectedDay.date).toBe('2026-11-18');
    expect(result.current.monday).toEqual(new Date(2026, 10, 16));
    expect(result.current.sunday).toEqual(new Date(2026, 10, 22));
    expect(result.current.canGoForward).toBe(false);
    expect(result.current.canGoBack).toBe(true);

    await act(async () => result.current.selectDay('2026-11-17'));
    expect(result.current.selectedDay.doses[0]?.status).toBe('alindi');
  });

  it('geçmiş haftaya gidince Pazar seçilir, bu haftadan ileri gidilmez', async () => {
    const { result } = await setup(() => useHistoryWeek(), at(9));
    await act(async () => result.current.previousWeek());
    expect(result.current.selectedDay.date).toBe('2026-11-15');
    expect(result.current.canGoForward).toBe(true);
    await act(async () => result.current.nextWeek());
    await act(async () => result.current.nextWeek());
    expect(result.current.monday).toEqual(new Date(2026, 10, 16));
  });
});

describe('useMedicationList', () => {
  it('bitmek üzere olanları sayar, işareti değiştirir ve siler', async () => {
    const low = makeMedication({ id: 'ilac2', stock: 2 });
    const { result, services } = await setup(() => useMedicationList(), at(9), {
      medications: [makeMedication(), low],
    });
    expect(result.current.lowCount).toBe(1);
    expect(result.current.now).toEqual(at(9));

    await act(() => result.current.toggleMarkedLow(low));
    expect(services.medications.update).toHaveBeenCalledWith([makeMedication(), low], 'ilac2', {
      markedLow: true,
    });
    await act(() => result.current.remove(low));
    expect(services.medications.remove).toHaveBeenCalledWith(expect.any(Array), 'ilac2');
    expect(result.current.error).toBeNull();
  });

  it('işlem başarısızsa Türkçe hata gösterir', async () => {
    const { result, services } = await setup(() => useMedicationList(), at(9));
    services.medications.remove.mockRejectedValue(
      new StorageError('silinemedi', 'İlaç silinemedi. Lütfen tekrar deneyin.'),
    );
    await act(() => result.current.remove(makeMedication()));
    expect(result.current.error).toBe('İlaç silinemedi. Lütfen tekrar deneyin.');

    services.medications.remove.mockRejectedValue(new Error('teknik'));
    await act(() => result.current.remove(makeMedication()));
    expect(result.current.error).toBe('İşlem yapılamadı. Lütfen tekrar deneyin.');
  });
});

describe('useNotice', () => {
  it('kısa mesaj 5 saniye sonra kaybolur', async () => {
    const { result } = await setup(
      () => ({ notice: useNotice(), list: useMedicationList() }),
      at(9),
    );
    await act(() => result.current.list.toggleMarkedLow(makeMedication()));
    expect(result.current.notice).toBe('Değişiklik kaydedildi');
    await act(async () => jest.advanceTimersByTime(4999));
    expect(result.current.notice).toBe('Değişiklik kaydedildi');
    await act(async () => jest.advanceTimersByTime(1));
    expect(result.current.notice).toBeNull();
  });
});

describe('useNow', () => {
  it('30 saniyede bir ve uygulama öne gelince yenilenir', async () => {
    jest.useFakeTimers({ now: at(9) });
    let onChange: (state: string) => void = () => {};
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onChange = listener as (state: string) => void;
      return { remove };
    });
    const { result, unmount } = await renderHook(() => useNow());
    expect(result.current).toEqual(at(9));

    await act(async () => jest.advanceTimersByTime(30_000));
    expect(result.current).toEqual(new Date(at(9).getTime() + 30_000));

    jest.setSystemTime(at(10));
    await act(async () => onChange('background'));
    expect(result.current).not.toEqual(at(10));
    await act(async () => onChange('active'));
    expect(result.current).toEqual(at(10));

    await unmount();
    expect(remove).toHaveBeenCalled();
  });
});

describe('useAuth', () => {
  it('sağlayıcı dışında anlaşılır hata verir', async () => {
    await expect(renderHook(() => useAuth())).rejects.toThrow('AuthProvider');
  });
});
