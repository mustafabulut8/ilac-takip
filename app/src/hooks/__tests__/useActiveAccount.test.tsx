import { renderHook, waitFor } from '@testing-library/react-native';

import { useActiveAccount } from '../useActiveAccount';

const mockActivate = jest.fn();
jest.mock('@/services', () => ({
  accountSession: { activate: (userId: string | null) => mockActivate(userId) },
}));

describe('useActiveAccount', () => {
  beforeEach(() => mockActivate.mockReset().mockResolvedValue(undefined));

  it('oturum bilgisi gelmeden hiçbir hesap etkinleşmez', async () => {
    const { result } = await renderHook(() => useActiveAccount(undefined));
    expect(result.current).toBeNull();
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('hesap etkinleşince döner; hesap değişince yenisi hazır olana kadar boş', async () => {
    let resolveSecond: () => void = () => {};
    const { result, rerender } = await renderHook(
      ({ userId }: { userId: string | null }) => useActiveAccount(userId),
      { initialProps: { userId: 'ayse' } },
    );
    await waitFor(() => expect(result.current).toEqual({ userId: 'ayse' }));

    mockActivate.mockImplementation(
      () => new Promise<void>((resolve) => (resolveSecond = resolve)),
    );
    await rerender({ userId: null });
    expect(result.current).toBeNull();
    resolveSecond();
    await waitFor(() => expect(result.current).toEqual({ userId: null }));
  });

  it('etkinleştirme hata verse de uygulama açılır', async () => {
    mockActivate.mockRejectedValue(new Error('depo'));
    const { result } = await renderHook(() => useActiveAccount('ayse'));
    await waitFor(() => expect(result.current).toEqual({ userId: 'ayse' }));
  });
});
