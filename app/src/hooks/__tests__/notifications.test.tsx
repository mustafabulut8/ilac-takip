import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AppState, Linking } from 'react-native';

import { NotificationError } from '@/errors';
import { makeMedication } from '@/test-utils/fakes';
import { makeMedicationsHarness } from '@/test-utils/providers';

import { useDoseNotificationTaps } from '../useDoseNotificationTaps';
import { useNotificationPermission } from '../useNotificationPermission';
import { useReminderSync } from '../useReminderSync';
import { useSnooze } from '../useSnooze';
import { useTestNotification } from '../useTestNotification';

const mockNotifications = {
  subscribeToDoseTaps: jest.fn(),
  permissionStatus: jest.fn(),
  requestPermission: jest.fn(),
  snooze: jest.fn(),
  scheduleTest: jest.fn(),
};
const mockMedicationService = { syncReminders: jest.fn() };

jest.mock('@/services', () => {
  const { DoseCalculator } = jest.requireActual('@/services/DoseCalculator');
  // Testteki sahteler modül yüklendikten sonra tanımlanır; bu yüzden geç okunur.
  return {
    get notificationService() {
      return mockNotifications;
    },
    get medicationService() {
      return mockMedicationService;
    },
    doseCalculator: new DoseCalculator(),
  };
});
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

/** AppState olaylarını testten tetiklemek için. */
function captureAppState() {
  const listeners: ((state: string) => void)[] = [];
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    listeners.push(listener as (state: string) => void);
    return { remove };
  });
  return { emit: (state: string) => listeners.forEach((listener) => listener(state)), remove };
}

beforeEach(() => {
  Object.values(mockNotifications).forEach((fn) => fn.mockReset());
  mockMedicationService.syncReminders.mockReset();
});

describe('useDoseNotificationTaps', () => {
  it('veri yüklenmeden dinlemez; yüklenince dokunuşta ALDIM sayfasını açar', async () => {
    const unsubscribe = jest.fn();
    mockNotifications.subscribeToDoseTaps.mockReturnValue(unsubscribe);
    const hook = await renderHook(
      ({ loaded }: { loaded: boolean }) => useDoseNotificationTaps(loaded),
      {
        initialProps: { loaded: false },
      },
    );
    expect(mockNotifications.subscribeToDoseTaps).not.toHaveBeenCalled();

    await hook.rerender({ loaded: true });
    const onTap = mockNotifications.subscribeToDoseTaps.mock.calls[0][0];
    onTap({ medicationId: 'ilac1', time: '08:00', date: '2026-11-16' });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/aldim/[id]',
      params: { id: 'ilac1', time: '08:00', date: '2026-11-16' },
    });

    await hook.unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('useNotificationPermission', () => {
  it('durumu okur, uygulama öne gelince yeniden bakar', async () => {
    const appState = captureAppState();
    mockNotifications.permissionStatus.mockResolvedValue('undetermined');
    const { result, unmount } = await renderHook(() => useNotificationPermission());
    await waitFor(() => expect(result.current.status).toBe('undetermined'));
    expect(result.current.missing).toBe(true);

    mockNotifications.permissionStatus.mockResolvedValue('granted');
    await act(async () => appState.emit('active'));
    await waitFor(() => expect(result.current.missing).toBe(false));
    await act(async () => appState.emit('background'));
    expect(mockNotifications.permissionStatus).toHaveBeenCalledTimes(2);

    await unmount();
    expect(appState.remove).toHaveBeenCalled();
  });

  it('sorulabiliyorsa izin ister; reddedildiyse telefonun Ayarlar’ını açar', async () => {
    mockNotifications.permissionStatus.mockResolvedValue('undetermined');
    mockNotifications.requestPermission.mockResolvedValue(true);
    const { result } = await renderHook(() => useNotificationPermission());
    await waitFor(() => expect(result.current.status).toBe('undetermined'));
    let asked: boolean | undefined;
    await act(async () => {
      asked = await result.current.request();
    });
    expect(asked).toBe(true);
    expect(mockNotifications.requestPermission).toHaveBeenCalled();

    mockNotifications.permissionStatus.mockResolvedValue('denied');
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const denied = await renderHook(() => useNotificationPermission());
    await waitFor(() => expect(denied.result.current.status).toBe('denied'));
    let granted: boolean | undefined;
    await act(async () => {
      granted = await denied.result.current.request();
    });
    expect(granted).toBe(false);
    expect(openSettings).toHaveBeenCalled();
  });

  it('izin okunamazsa durum bilinmez kalır ve uyarı gösterilmez', async () => {
    mockNotifications.permissionStatus.mockRejectedValue(new Error('okunamadı'));
    const { result } = await renderHook(() => useNotificationPermission());
    await waitFor(() => expect(mockNotifications.permissionStatus).toHaveBeenCalled());
    expect(result.current.status).toBeNull();
    expect(result.current.missing).toBe(false);
  });
});

describe('useSnooze', () => {
  const medication = makeMedication();

  it('ertelemeyi kurar ve sonucu bildirir', async () => {
    mockNotifications.snooze.mockResolvedValue(undefined);
    const { result } = await renderHook(() => useSnooze());
    await act(() => result.current.snooze(medication, '2026-11-16', '08:00'));
    expect(mockNotifications.snooze).toHaveBeenCalledWith({
      medication,
      date: '2026-11-16',
      time: '08:00',
    });
    expect(result.current.isSnoozed).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('erteleme başarısızsa Türkçe hata verir', async () => {
    mockNotifications.snooze.mockRejectedValue(
      new NotificationError('izin yok', 'Hatırlatma ertelenemedi. Bildirim iznini kontrol edin.'),
    );
    const { result } = await renderHook(() => useSnooze());
    await act(() => result.current.snooze(medication, '2026-11-16', '08:00'));
    expect(result.current.isSnoozed).toBe(false);
    expect(result.current.error).toBe('Hatırlatma ertelenemedi. Bildirim iznini kontrol edin.');
  });
});

describe('useReminderSync', () => {
  it('yüklenince, uygulama her öne geldiğinde hatırlatmaları eşitler', async () => {
    const appState = captureAppState();
    const now = new Date(2026, 10, 16, 9, 0);
    const harness = makeMedicationsHarness([makeMedication()], { now: () => now });
    const { unmount } = await renderHook(() => useReminderSync(), { wrapper: harness.wrapper });
    await waitFor(() => expect(AppState.addEventListener).toHaveBeenCalled());

    await act(async () => appState.emit('background'));
    expect(mockMedicationService.syncReminders).not.toHaveBeenCalled();
    await act(async () => appState.emit('active'));
    expect(mockMedicationService.syncReminders).toHaveBeenCalledWith([makeMedication()]);
    await unmount();
    expect(appState.remove).toHaveBeenCalled();
  });
});

describe('useTestNotification', () => {
  const at = (hour: number) => new Date(2026, 10, 16, hour, 0);

  async function setup(now: Date) {
    jest.useFakeTimers({ now });
    const harness = makeMedicationsHarness([makeMedication()], { now: () => now });
    const hook = await renderHook(() => useTestNotification(), { wrapper: harness.wrapper });
    await act(async () => {});
    return hook;
  }

  afterEach(() => jest.useRealTimers());

  it('sıradaki doz için test bildirimi kurar', async () => {
    mockNotifications.scheduleTest.mockResolvedValue(undefined);
    const { result } = await setup(at(7));
    await act(() => result.current.sendTestNotification());
    expect(mockNotifications.scheduleTest).toHaveBeenCalledWith(
      expect.objectContaining({ time: '08:00' }),
    );
    expect(result.current.testMessage).toBe('Aspirin için bildirim 1 dakika sonra gelecek.');
  });

  it('kurulamazsa veya bekleyen doz yoksa nedenini söyler', async () => {
    mockNotifications.scheduleTest.mockRejectedValue(new Error('izin yok'));
    const failing = await setup(at(7));
    await act(() => failing.result.current.sendTestNotification());
    expect(failing.result.current.testMessage).toBe(
      'Test bildirimi planlanamadı. Bildirim iznini kontrol edin.',
    );
    jest.useRealTimers();

    const late = await setup(at(23));
    await act(() => late.result.current.sendTestNotification());
    expect(late.result.current.testMessage).toBe(
      'Bugün bekleyen doz yok. Test için şu andan sonraki bir saatle ilaç ekleyin.',
    );
  });
});
