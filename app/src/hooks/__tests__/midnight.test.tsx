import { act, render, renderHook, screen } from '@testing-library/react-native';

import { DoseCard } from '@/components/dose-card';
import { doseLogIdOf, type DoseLog } from '@/models';
import { makeMedication } from '@/test-utils/fakes';
import { makeMedicationsHarness } from '@/test-utils/providers';

import { useSimpleHome } from '../useSimpleHome';
import { useTodayDoses } from '../useTodayDoses';

// Açık bulgu (kalite-raporu.md): gece yarısını geçince dünün henüz alınabilen dozu
// (30 dakikalık süre dolmamış) Bugün ve Sade ana ekranında görünmüyordu.
jest.mock('@/services', () => {
  const { DoseCalculator } = jest.requireActual('@/services/DoseCalculator');
  return { doseCalculator: new DoseCalculator() };
});
jest.mock('@/hooks/useMedicationPhoto', () => ({ useMedicationPhoto: () => null }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));

/** 17 Kasım 2026, saat ve dakika verilir. Dün: 16 Kasım. */
const at = (hour: number, minute: number) => new Date(2026, 10, 17, hour, minute);
const night = makeMedication({ times: ['08:00', '23:50'] });
const takenYesterday: DoseLog = {
  id: doseLogIdOf('ilac1', '2026-11-16', '23:50'),
  medicationId: 'ilac1',
  date: '2026-11-16',
  time: '23:50',
  takenAt: '2026-11-16T20:55:00.000Z',
};

async function setup<T>(hook: () => T, now: Date, doseLogs: DoseLog[] = []) {
  jest.useFakeTimers({ now });
  const harness = makeMedicationsHarness([night], { doseLogs, now: () => now });
  const rendered = await renderHook(hook, { wrapper: harness.wrapper });
  await act(async () => {});
  return { ...rendered, ...harness };
}

afterEach(() => jest.useRealTimers());

describe('gece yarısından sonra dünün dozu: Bugün ekranı', () => {
  it('00:10’da dünün 23:50 dozu bekliyor olarak listede, ilerlemeye sayılmaz', async () => {
    const { result } = await setup(() => useTodayDoses(), at(0, 10));
    expect(result.current.doses.map(({ date, time, status }) => [date, time, status])).toEqual([
      ['2026-11-16', '23:50', 'bekliyor'],
      ['2026-11-17', '08:00', 'bekliyor'],
      ['2026-11-17', '23:50', 'bekliyor'],
    ]);
    expect(result.current.progress).toMatchObject({ total: 2, taken: 0 });
    expect(result.current.nextDose).toMatchObject({ date: '2026-11-16', time: '23:50' });
  });

  it('30 dakika dolunca (00:21) listeden çıkar', async () => {
    const { result } = await setup(() => useTodayDoses(), at(0, 21));
    expect(result.current.doses.every((dose) => dose.date === '2026-11-17')).toBe(true);
  });

  it('dün alındıysa listede görünmez', async () => {
    const { result } = await setup(() => useTodayDoses(), at(0, 10), [takenYesterday]);
    expect(result.current.doses.every((dose) => dose.date === '2026-11-17')).toBe(true);
  });
});

describe('gece yarısından sonra dünün dozu: Sade ana ekran', () => {
  it('dünün dozu gösterilir, gecikme 20 dakikadır; "Aldım" dünün günüyle kaydeder', async () => {
    const { result, storage } = await setup(() => useSimpleHome(), at(0, 10));
    expect(result.current.focus).toMatchObject({ date: '2026-11-16', time: '23:50' });
    expect(result.current.lateMinutes).toBe(20);

    await act(() => result.current.confirmFocus());
    expect(storage.doseLogs.map((log) => log.id)).toEqual(['ilac1_2026-11-16_23:50']);
    expect(storage.medications[0]?.stock).toBe(9);
    expect(result.current.focus).toMatchObject({ date: '2026-11-17', time: '08:00' });
  });
});

describe('doz kartı', () => {
  it('dünden kalan dozda "Dün" yazar; ekran okuyucu da söyler', async () => {
    await render(
      <DoseCard
        dose={{ medication: night, date: '2026-11-16', time: '23:50', status: 'bekliyor' }}
        now={at(0, 10)}
        onPress={() => {}}
      />,
    );
    expect(screen.getByText(/Dün · 23:50/)).toBeTruthy();
    expect(screen.getByLabelText(/dün saat 23:50/)).toBeTruthy();
  });
});
