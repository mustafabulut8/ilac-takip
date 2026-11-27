import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useCloudSync } from '../useCloudSync';

const mockRun = jest.fn().mockResolvedValue(undefined);
let mockReconnect: () => void = () => {};
const mockStopListening = jest.fn();

jest.mock('@/services', () => ({
  syncService: { run: () => mockRun() },
  networkStatus: {
    onReconnect: (listener: () => void) => {
      mockReconnect = listener;
      return mockStopListening;
    },
  },
}));

describe('useCloudSync', () => {
  it('uygulama öne gelince ve internet geri gelince eşitler; ayrılınca dinlemeyi bırakır', async () => {
    let onAppState: (state: string) => void = () => {};
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onAppState = listener as (state: string) => void;
      return { remove };
    });

    const { unmount } = await renderHook(() => useCloudSync());
    onAppState('background');
    expect(mockRun).not.toHaveBeenCalled();
    onAppState('active');
    mockReconnect();
    expect(mockRun).toHaveBeenCalledTimes(2);

    await unmount();
    expect(remove).toHaveBeenCalled();
    expect(mockStopListening).toHaveBeenCalled();
  });
});
