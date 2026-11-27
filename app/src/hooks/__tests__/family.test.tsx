import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useFamilyDashboard } from '../useFamilyDashboard';
import { useOnline } from '../useOnline';

const LINK = (personId: string) => ({
  id: `l-${personId}`,
  personId,
  name: personId,
  role: 'sade',
  relationLabel: 'Annem',
  createdAt: '',
});
const mockLinks = { links: [LINK('fatma'), LINK('ali')], error: null, reload: jest.fn() };
const mockSummary = jest.fn();
const realtime: Record<string, () => void> = {};
const mockStop = jest.fn();
let mockNetworkListener: (online: boolean) => void = () => {};

const mockFocus: { callback?: () => void } = {};
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocus.callback = callback;
  },
}));
jest.mock('@/hooks/useCareLinks', () => ({ useCareLinks: () => mockLinks }));
jest.mock('@/services', () => ({
  familyDashboard: { summaryOf: (id: string) => mockSummary(id) },
  realtimeMedicationChanges: {
    subscribe: (id: string, onChange: () => void) => {
      realtime[id] = onChange;
      return mockStop;
    },
  },
  networkStatus: {
    isOnline: async () => false,
    onChange: (listener: (online: boolean) => void) => {
      mockNetworkListener = listener;
      return jest.fn();
    },
  },
}));

describe('useFamilyDashboard', () => {
  beforeEach(() => {
    mockSummary.mockReset().mockImplementation(async (id: string) => ({ id }));
  });

  it('her yakın için ayrı özet; biri alınamazsa yalnız o kart hata gösterir', async () => {
    mockSummary.mockImplementation(async (id: string) => {
      if (id === 'ali') throw new Error('ağ');
      return { id };
    });
    const { result } = await renderHook(() => useFamilyDashboard());
    await waitFor(() =>
      expect(result.current.people?.map((person) => person.summary)).toEqual([
        { id: 'fatma' },
        'error',
      ]),
    );
  });

  it('sunucuda değişiklik olunca (Realtime) özetler, ekrana dönünce bağlantılar yeniden okunur', async () => {
    const { result, unmount } = await renderHook(() => useFamilyDashboard());
    await waitFor(() => expect(result.current.people?.[0]?.summary).toEqual({ id: 'fatma' }));
    const before = mockSummary.mock.calls.length;
    await act(async () => realtime.fatma?.());
    await waitFor(() => expect(mockSummary.mock.calls.length).toBeGreaterThan(before));
    await act(async () => mockFocus.callback?.());
    expect(mockLinks.reload).toHaveBeenCalled();
    await unmount();
    expect(mockStop).toHaveBeenCalled();
  });
});

describe('useOnline', () => {
  it('ilk durumu okur ve değişiklikleri izler', async () => {
    const { result } = await renderHook(() => useOnline());
    await waitFor(() => expect(result.current).toBe(false));
    await act(async () => mockNetworkListener(true));
    expect(result.current).toBe(true);
  });
});
