import { DeviceStatusReporter } from '../DeviceStatusReporter';

const NOW = new Date('2026-11-27T10:00:00.000Z');

function setup(enabled = true, owner: string | null = 'fatma') {
  const api = { write: jest.fn().mockResolvedValue(undefined) };
  const sync = { isEnabled: () => enabled, currentOwner: () => owner };
  const reporter = new DeviceStatusReporter(api, sync, () => NOW);
  return { api, reporter };
}

describe('DeviceStatusReporter (reminders_until)', () => {
  it('hatırlatmaların ne zamana kadar kurulu olduğunu sunucuya yazar', async () => {
    const { api, reporter } = setup();
    await reporter.report(new Date('2026-12-01T17:00:00.000Z'));
    expect(api.write).toHaveBeenCalledWith({
      owner_id: 'fatma',
      reminders_until: '2026-12-01T17:00:00.000Z',
      last_synced_at: NOW.toISOString(),
    });
  });

  it('tekrarlanan hatırlatmalarda boş yazılır; aynı değer tekrar gönderilmez', async () => {
    const { api, reporter } = setup();
    await reporter.report(null);
    await reporter.report(null);
    expect(api.write).toHaveBeenCalledTimes(1);
    expect(api.write.mock.calls[0]?.[0]).toMatchObject({ reminders_until: null });
  });

  it('rıza yoksa (eşitleme kapalı) sunucuya hiçbir şey gitmez', async () => {
    const { api, reporter } = setup(false);
    await reporter.report(new Date());
    expect(api.write).not.toHaveBeenCalled();
  });

  it('yazılamazsa hata fırlatmaz, sonraki seferde yeniden dener', async () => {
    const { api, reporter } = setup();
    api.write.mockRejectedValueOnce(new Error('ağ'));
    await expect(reporter.report(null)).resolves.toBeUndefined();
    await reporter.report(null);
    expect(api.write).toHaveBeenCalledTimes(2);
  });
});
