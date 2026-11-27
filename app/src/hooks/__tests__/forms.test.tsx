import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { AuthError, ValidationError } from '@/errors';

import { useFormSubmit } from '../useFormSubmit';
import { useMedicationPhoto } from '../useMedicationPhoto';
import { usePhotoPicker } from '../usePhotoPicker';

const mockUrlFor = jest.fn(async (path: string) => `https://imzali/${path}`);
jest.mock('@/services', () => ({
  photoService: { photoUri: (fileName: string) => `file:///belgeler/photos/${fileName}` },
  photoUrls: { urlFor: (path: string) => mockUrlFor(path) },
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const picker = jest.mocked(ImagePicker);

describe('useFormSubmit', () => {
  it('başarılı işlemde true döner, sürerken meşguldür', async () => {
    const { result } = await renderHook(() => useFormSubmit<'email'>());
    let finish = () => {};
    let ok: boolean | undefined;
    await act(async () => {
      const running = result.current.submit(() => new Promise<void>((done) => (finish = done)));
      await Promise.resolve();
      finish();
      ok = await running;
    });
    expect(ok).toBe(true);
    expect(result.current.busy).toBe(false);
  });

  it('alan hatalarını alanların altına, diğer hataları genel mesaja yazar', async () => {
    const { result } = await renderHook(() => useFormSubmit<'email' | 'password'>());
    await act(async () => {
      await result.current.submit(async () => {
        throw new ValidationError({ email: 'E-posta adresinizi yazın.' });
      });
    });
    expect(result.current.fieldErrors).toEqual({ email: 'E-posta adresinizi yazın.' });

    await act(async () => result.current.clearField('email'));
    await act(async () => result.current.clearField('password'));
    expect(result.current.fieldErrors).toEqual({ email: undefined });

    await act(async () => {
      await result.current.submit(async () => {
        throw new AuthError('offline', 't', 'İnternet bağlantısı yok.');
      });
    });
    expect(result.current.error).toBe('İnternet bağlantısı yok.');

    await act(async () => {
      await result.current.submit(async () => {
        throw new Error('teknik');
      });
    });
    expect(result.current.error).toBe('Bir sorun oluştu. Lütfen yeniden deneyin.');
  });

  it('işlem sürerken ikinci gönderim yapılmaz', async () => {
    const { result } = await renderHook(() => useFormSubmit());
    const action = jest.fn(() => new Promise<void>(() => {}));
    await act(async () => {
      void result.current.submit(action);
    });
    let second: boolean | undefined;
    await act(async () => {
      second = await result.current.submit(action);
    });
    expect(second).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe('useMedicationPhoto', () => {
  it('dosya adından adres üretir; fotoğraf yoksa null', async () => {
    const withPhoto = await renderHook(() => useMedicationPhoto('ilac1.jpg'));
    expect(withPhoto.result.current).toBe('file:///belgeler/photos/ilac1.jpg');
    const without = await renderHook(() => useMedicationPhoto(''));
    expect(without.result.current).toBeNull();
  });

  it('telefonda dosya yoksa sunucudaki fotoğrafı imzalı adresle, yoluyla önbelleğe alarak gösterir', async () => {
    const { result } = await renderHook(() => useMedicationPhoto('', 'fatma/met-1.jpg'));
    await waitFor(() =>
      expect(result.current).toEqual({
        uri: 'https://imzali/fatma/met-1.jpg',
        cacheKey: 'fatma/met-1.jpg',
      }),
    );
  });

  it('telefondaki dosya varsa sunucuya sorulmaz; adres alınamazsa form ikonu kalır', async () => {
    mockUrlFor.mockClear();
    const local = await renderHook(() => useMedicationPhoto('ilac1.jpg', 'fatma/met-1.jpg'));
    expect(local.result.current).toBe('file:///belgeler/photos/ilac1.jpg');
    expect(mockUrlFor).not.toHaveBeenCalled();

    mockUrlFor.mockRejectedValueOnce(new Error('ağ'));
    const failed = await renderHook(() => useMedicationPhoto('', 'fatma/yok.jpg'));
    await waitFor(() => expect(mockUrlFor).toHaveBeenCalled());
    expect(failed.result.current).toBeNull();
  });
});

describe('usePhotoPicker', () => {
  const picked = { canceled: false, assets: [{ uri: 'file:///foto.jpg' }] };

  async function setup() {
    const onPicked = jest.fn();
    const onError = jest.fn();
    const { result } = await renderHook(() => usePhotoPicker({ onPicked, onError }));
    return { result, onPicked, onError };
  }

  it('kamera izni varsa çeker, yoksa Türkçe uyarı verir', async () => {
    const { result, onPicked, onError } = await setup();
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchCameraAsync.mockResolvedValue(picked as never);
    await act(() => result.current.takePhoto());
    expect(onPicked).toHaveBeenCalledWith('file:///foto.jpg');

    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);
    await act(() => result.current.takePhoto());
    expect(onError).toHaveBeenCalledWith(
      'Kamera izni verilmedi. Galeriden seçebilir veya Ayarlar’dan izin verebilirsiniz.',
    );
  });

  it('galeriden seçer; vazgeçilirse hiçbir şey olmaz', async () => {
    const { result, onPicked } = await setup();
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as never);
    await act(() => result.current.pickPhoto());
    expect(onPicked).not.toHaveBeenCalled();
    picker.launchImageLibraryAsync.mockResolvedValue(picked as never);
    await act(() => result.current.pickPhoto());
    expect(onPicked).toHaveBeenCalledWith('file:///foto.jpg');
  });
});
