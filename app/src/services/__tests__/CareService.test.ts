import { CareError, OfflineError, ValidationError } from '@/errors';

import { CareService, type CareApi } from '../CareService';

function setup({ online = true } = {}) {
  const api = {
    createInviteCode: jest.fn(async () => ({ code: '482913', expires_at: '2026-11-28T09:00:00Z' })),
    redeemInviteCode: jest.fn(async (_code: string, _label: string) => ({
      status: 'ok',
      patient_id: 'yasli',
      patient_name: 'Fatma',
    })),
    listLinks: jest.fn(async () => [] as unknown[]),
    removeLink: jest.fn(async (_id: string) => undefined),
  } satisfies CareApi;
  const network = { isOnline: jest.fn(async () => online) };
  return { api, network, service: new CareService(api, network) };
}

describe('CareService', () => {
  it('kod üretir; bitiş anıyla döner', async () => {
    const { service } = setup();
    expect(await service.createInviteCode()).toEqual({
      code: '482913',
      expiresAt: '2026-11-28T09:00:00Z',
    });
  });

  it('kodu temizleyip gönderir ve bağlanılan kişiyi döner', async () => {
    const { api, service } = setup();
    const result = await service.redeem({ code: '482 913', relationLabel: ' Annem ' });
    expect(api.redeemInviteCode).toHaveBeenCalledWith('482913', 'Annem');
    expect(result).toEqual({ patientId: 'yasli', patientName: 'Fatma' });
  });

  it.each([
    ['invalid_code', 'Kod geçersiz veya süresi dolmuş. Yakınınızdan yeni kod isteyin.'],
    ['too_many_attempts', 'Çok fazla deneme yapıldı. Lütfen bir saat sonra tekrar deneyin.'],
  ])('sunucu "%s" derse Türkçe hata verir', async (status, message) => {
    const { api, service } = setup();
    api.redeemInviteCode.mockResolvedValue({
      status,
      patient_id: null,
      patient_name: null,
    } as never);
    const error = await service
      .redeem({ code: '482913', relationLabel: 'Annem' })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(CareError);
    expect((error as CareError).kind).toBe(status);
    expect((error as CareError).userMessage).toBe(message);
  });

  it('geçersiz girişte sunucuya gitmez', async () => {
    const { api, service } = setup();
    await expect(service.redeem({ code: '1', relationLabel: '' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(api.redeemInviteCode).not.toHaveBeenCalled();
  });

  it('internet yoksa kod üretmez, bağlanmaz, bağlantı kaldırmaz', async () => {
    const { api, service } = setup({ online: false });
    await expect(service.createInviteCode()).rejects.toBeInstanceOf(OfflineError);
    await expect(service.redeem({ code: '482913', relationLabel: 'Annem' })).rejects.toBeInstanceOf(
      OfflineError,
    );
    await expect(service.removeLink('l1')).rejects.toBeInstanceOf(OfflineError);
    expect(api.createInviteCode).not.toHaveBeenCalled();
    expect(api.removeLink).not.toHaveBeenCalled();
  });

  it('bağlantıları kendi tarafından okur, okunamayan satırı atlar', async () => {
    const { api, service } = setup();
    api.listLinks.mockResolvedValue([
      {
        id: 'l1',
        relation_label: 'Annem',
        created_at: 'x',
        caregiver: { id: 'aile', ad: 'Ayşe', rol: 'aile' },
        patient: { id: 'yasli', ad: 'Fatma', rol: 'sade' },
      },
      { id: 'bozuk' },
    ]);
    expect((await service.links('aile')).map((link) => link.name)).toEqual(['Fatma']);
  });

  it('bağlantıyı kaldırır', async () => {
    const { api, service } = setup();
    await service.removeLink('l1');
    expect(api.removeLink).toHaveBeenCalledWith('l1');
  });
});
