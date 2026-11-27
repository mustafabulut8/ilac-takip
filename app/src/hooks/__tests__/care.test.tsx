import { act, renderHook, waitFor } from '@testing-library/react-native';

import { CareError, ValidationError } from '@/errors';

import { useCareLinks } from '../useCareLinks';
import { useInviteCode } from '../useInviteCode';
import { useRedeemCode } from '../useRedeemCode';

const mockCare = {
  createInviteCode: jest.fn(),
  links: jest.fn(),
  removeLink: jest.fn(),
  redeem: jest.fn(),
};

jest.mock('@/services', () => ({
  get careService() {
    return mockCare;
  },
}));
jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ profile: { id: 'u1' } }) }));

const LINK = {
  id: 'l1',
  personId: 'p',
  name: 'Ayşe',
  role: 'aile',
  relationLabel: 'Kızım',
  createdAt: '',
};

beforeEach(() => {
  mockCare.createInviteCode.mockReset().mockResolvedValue({ code: '482913', expiresAt: 'x' });
  mockCare.links.mockReset().mockResolvedValue([LINK]);
  mockCare.removeLink.mockReset().mockResolvedValue(undefined);
  mockCare.redeem.mockReset().mockResolvedValue({ patientId: 'p', patientName: 'Fatma' });
});

describe('useInviteCode', () => {
  it('açılınca kod üretir; "Yeni kod al" yenisini ister', async () => {
    const { result } = await renderHook(() => useInviteCode(true));
    await waitFor(() => expect(result.current.code).toBe('482913'));
    mockCare.createInviteCode.mockResolvedValue({ code: '111222', expiresAt: 'y' });
    await act(async () => result.current.renew());
    await waitFor(() => expect(result.current.code).toBe('111222'));
  });

  it('rıza yokken kod üretmez', async () => {
    const { result } = await renderHook(() => useInviteCode(false));
    expect(result.current.code).toBeNull();
    expect(mockCare.createInviteCode).not.toHaveBeenCalled();
  });

  it('üretilemezse Türkçe hata gösterir', async () => {
    mockCare.createInviteCode.mockRejectedValue(new Error('ağ'));
    const { result } = await renderHook(() => useInviteCode(true));
    await waitFor(() => expect(result.current.error).toBe('Kod alınamadı. Lütfen tekrar deneyin.'));
  });
});

describe('useCareLinks', () => {
  it('bağlantıları yükler, kaldırınca listeyi yeniler', async () => {
    const { result } = await renderHook(() => useCareLinks());
    await waitFor(() => expect(result.current.links).toEqual([LINK]));
    expect(mockCare.links).toHaveBeenCalledWith('u1');
    mockCare.links.mockResolvedValue([]);
    await act(() => result.current.remove('l1'));
    expect(mockCare.removeLink).toHaveBeenCalledWith('l1');
    await waitFor(() => expect(result.current.links).toEqual([]));
  });

  it('yüklenemezse hata mesajı verir', async () => {
    mockCare.links.mockRejectedValue(new Error('ağ'));
    const { result } = await renderHook(() => useCareLinks());
    await waitFor(() =>
      expect(result.current.error).toBe(
        'Bağlı yakınlar alınamadı. İnternet bağlantınızı kontrol edin.',
      ),
    );
  });
});

describe('useRedeemCode', () => {
  it('bağlanınca kişiyi döner', async () => {
    const { result } = await renderHook(() => useRedeemCode());
    let person: unknown;
    await act(async () => {
      person = await result.current.redeem({ code: '482913', relationLabel: 'Annem' });
    });
    expect(person).toEqual({ patientId: 'p', patientName: 'Fatma' });
  });

  it('alan hatalarını ve sunucu mesajını ayrı verir', async () => {
    const { result } = await renderHook(() => useRedeemCode());
    mockCare.redeem.mockRejectedValueOnce(new ValidationError({ code: 'Kod 6 rakamdan oluşur.' }));
    await act(async () => void (await result.current.redeem({ code: '1', relationLabel: 'A' })));
    expect(result.current.fieldErrors.code).toBe('Kod 6 rakamdan oluşur.');

    mockCare.redeem.mockRejectedValueOnce(new CareError('invalid_code', 'Kod geçersiz'));
    await act(async () => void (await result.current.redeem({ code: '1', relationLabel: 'A' })));
    expect(result.current.error).toBe('Kod geçersiz');
  });
});
