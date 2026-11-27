import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { StorageError } from '@/errors';
import type { DoseLog } from '@/models';
import { makeMedication } from '@/test-utils/fakes';

import { MedicationsProvider, useMedications } from '../medications';

// Gerçek servisler (composition root) bu testte kurulmaz; sahteleri sağlayıcıya verilir.
jest.mock('@/services', () => ({}));

const aspirin = makeMedication();
const log: DoseLog = {
  id: 'ilac1_2026-11-16_08:00',
  medicationId: 'ilac1',
  date: '2026-11-16',
  time: '08:00',
  takenAt: '',
};

function fakeServices() {
  return {
    medications: {
      load: jest.fn().mockResolvedValue({ medications: [aspirin], doseLogs: [], warnings: ['u'] }),
      add: jest.fn().mockResolvedValue({ medications: [aspirin, aspirin], notice: 'eklendi' }),
      update: jest.fn().mockResolvedValue({ medications: [], notice: 'güncellendi' }),
      remove: jest.fn().mockResolvedValue({ medications: [], notice: 'silindi' }),
    },
    doses: {
      confirmDose: jest.fn().mockResolvedValue({ medications: [aspirin], doseLogs: [log] }),
    },
    changes: {
      listener: null as ((medications: ReturnType<typeof makeMedication>[]) => void) | null,
      subscribe: jest.fn(function (
        this: { listener: unknown },
        listener: (medications: ReturnType<typeof makeMedication>[]) => void,
      ) {
        this.listener = listener;
        return jest.fn();
      }),
    },
  };
}

async function setup(services: ReturnType<typeof fakeServices> = fakeServices()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MedicationsProvider services={services}>{children}</MedicationsProvider>
  );
  const hook = await renderHook(() => useMedications(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoaded).toBe(true));
  return { ...hook, services };
}

describe('MedicationsProvider', () => {
  it('açılışta kayıtlı veriyi ve uyarıları yükler', async () => {
    const { result } = await setup();
    expect(result.current.medications).toEqual([aspirin]);
    expect(result.current.storageWarnings).toEqual(['u']);
  });

  it('veri okunamazsa Türkçe uyarı gösterir ve yine açılır', async () => {
    const services = fakeServices();
    services.medications.load.mockRejectedValue(
      new StorageError('okunamadı', 'Kayıtlı veriler telefondan okunamadı.'),
    );
    const { result } = await setup(services);
    expect(result.current.storageWarnings).toEqual(['Kayıtlı veriler telefondan okunamadı.']);
    expect(result.current.medications).toEqual([]);
  });

  it('ekleme, güncelleme ve silme listeyi ve kısa mesajı günceller', async () => {
    const { result, services } = await setup();
    await act(() => result.current.addMedication({} as never));
    expect(result.current.medications).toHaveLength(2);
    expect(result.current.notice).toBe('eklendi');
    expect(services.medications.add).toHaveBeenCalledWith([aspirin], {});

    await act(() => result.current.updateMedication('ilac1', { stock: 3 }));
    expect(result.current.notice).toBe('güncellendi');
    await act(() => result.current.removeMedication('ilac1'));
    expect(result.current.notice).toBe('silindi');
    expect(result.current.medications).toEqual([]);

    await act(() => result.current.clearNotice());
    expect(result.current.notice).toBeNull();
  });

  it('doz onayı kayıtları günceller; onay yapılmazsa durum değişmez', async () => {
    const { result, services } = await setup();
    await act(() => result.current.confirmDose('ilac1', '2026-11-16', '08:00'));
    expect(result.current.doseLogs).toEqual([log]);
    expect(services.doses.confirmDose).toHaveBeenCalledWith(
      { medications: [aspirin], doseLogs: [] },
      'ilac1',
      '2026-11-16',
      '08:00',
    );

    services.doses.confirmDose.mockResolvedValue(null);
    await act(() => result.current.confirmDose('ilac1', '2026-11-16', '08:00'));
    expect(result.current.doseLogs).toEqual([log]);
  });

  it('sağlayıcı dışında kullanılınca anlaşılır hata verir', async () => {
    await expect(renderHook(() => useMedications())).rejects.toThrow(
      'useMedications, MedicationsProvider içinde kullanılmalıdır.',
    );
  });
});

describe('MedicationsProvider: eşitlemeden gelen değişiklik', () => {
  it('sunucudan gelen liste ekrana yansır (aile ekledi, düzeltti veya sildi)', async () => {
    const { result, services } = await setup();
    const fromFamily = makeMedication({ id: 'ilac2', name: 'Ailenin eklediği' });
    await act(async () => services.changes.listener?.([aspirin, fromFamily]));
    expect(result.current.medications.map((item) => item.name)).toEqual([
      'Aspirin',
      'Ailenin eklediği',
    ]);
  });
});
