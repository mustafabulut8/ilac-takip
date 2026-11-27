import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { HEALTH_CONSENT_VERSION } from '@/constants/health-consent';

import { ConsentProvider, useConsent, type ConsentServices } from '../consent';

jest.mock('@/services', () => ({}));

const SADE = { id: 'u1', role: 'sade' as const };

function fakeServices(stored: 'granted' | 'none' = 'granted') {
  const unsubscribe = jest.fn();
  // Telefondaki kayıt gibi: işlem durumu değiştirir, `current` yenisini okur.
  let state = { status: stored as string, at: stored === 'none' ? null : 'x' };
  const set = (status: string) => async () => {
    state = { status, at: 'şimdi' };
  };
  const services = {
    consent: {
      current: jest.fn(async () => state as { status: 'granted'; at: string | null }),
      grant: jest.fn(set('granted')),
      decline: jest.fn(set('declined')),
      withdraw: jest.fn(set('withdrawn')),
    },
    sync: {
      setOwner: jest.fn(),
      start: jest.fn(),
      run: jest.fn().mockResolvedValue(undefined),
      uploadAll: jest.fn().mockResolvedValue(undefined),
    },
    changes: { subscribe: jest.fn(() => unsubscribe) },
  } satisfies ConsentServices;
  return { services, unsubscribe };
}

async function setup(
  profile: { id: string; role: 'sade' | 'standart' | 'aile' } | null,
  fake = fakeServices(),
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ConsentProvider profile={profile} services={fake.services}>
      {children}
    </ConsentProvider>
  );
  const hook = await renderHook(() => useConsent(), { wrapper });
  return { ...hook, ...fake };
}

describe('ConsentProvider', () => {
  it('rıza varsa eşitleme açılır, hemen çalışır ve canlı değişiklikler dinlenir', async () => {
    const { result, services } = await setup(SADE);
    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(services.sync.setOwner).toHaveBeenCalledWith('u1');
    expect(services.sync.start).toHaveBeenCalled();
    expect(services.sync.run).toHaveBeenCalled();
    expect(services.changes.subscribe).toHaveBeenCalledWith('u1', expect.any(Function));
  });

  it('rıza yoksa eşitleme kapalı kalır', async () => {
    const { result, services } = await setup(SADE, fakeServices('none'));
    await waitFor(() => expect(result.current.status).toBe('none'));
    expect(services.sync.start).not.toHaveBeenCalled();
    expect(services.changes.subscribe).not.toHaveBeenCalled();
  });

  it('kabul edilince metin sürümüyle kaydedilir ve telefondaki veri ilk kez yüklenir', async () => {
    const { result, services } = await setup(SADE, fakeServices('none'));
    await waitFor(() => expect(result.current.status).toBe('none'));
    await act(() => result.current.grant());
    expect(services.consent.grant).toHaveBeenCalledWith('u1', HEALTH_CONSENT_VERSION);
    expect(services.sync.uploadAll).toHaveBeenCalled();
    expect(result.current.status).toBe('granted');
    expect(services.changes.subscribe).toHaveBeenCalled();
  });

  it('"Şimdilik hayır" kaydedilir ve soru kapanır', async () => {
    const { result, services } = await setup(SADE, fakeServices('none'));
    await waitFor(() => expect(result.current.status).toBe('none'));
    await act(() => result.current.decline());
    expect(services.consent.decline).toHaveBeenCalledWith('u1');
    expect(result.current.status).toBe('declined');
  });

  it('geri alınınca canlı dinleme kapanır', async () => {
    const { result, services, unsubscribe } = await setup(SADE);
    await waitFor(() => expect(result.current.status).toBe('granted'));
    await act(() => result.current.withdraw());
    expect(services.consent.withdraw).toHaveBeenCalledWith('u1');
    expect(result.current.status).toBe('withdrawn');
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('oturum yoksa veya rol aileyse kendi verisi eşitlenmez', async () => {
    const guest = await setup(null);
    expect(guest.services.sync.setOwner).toHaveBeenCalledWith(null);
    expect(guest.result.current.status).toBeNull();

    const family = await setup({ id: 'u2', role: 'aile' });
    expect(family.services.sync.setOwner).toHaveBeenCalledWith(null);
    expect(family.services.consent.current).not.toHaveBeenCalled();
  });
});
