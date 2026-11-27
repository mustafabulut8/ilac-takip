import { StorageError } from '@/errors';
import { MemoryKeyValueStore } from '@/test-utils/fakes';

import { AccountSession } from '../AccountSession';
import { scopedKey, UserScopedStore } from '../local/UserScopedStore';

describe('UserScopedStore', () => {
  it('anahtarlar kullanıcıya özeldir; oturum yokken okuma boş, yazma reddedilir', async () => {
    const disk = new MemoryKeyValueStore();
    const store = new UserScopedStore(disk);
    expect(await store.getItem('medications')).toBeNull();
    await expect(store.setItem('medications', '[]')).rejects.toBeInstanceOf(StorageError);
    await expect(store.multiSet([['outbox', '[]']])).rejects.toBeInstanceOf(StorageError);
    await expect(store.multiRemove(['outbox'])).resolves.toBeUndefined();

    store.setUser('ayse');
    await store.multiSet([['outbox', '[1]']]);
    expect(disk.data.get(scopedKey('ayse', 'outbox'))).toBe('[1]');
    store.setUser('mehmet');
    expect(await store.getItem('outbox')).toBeNull();
    store.setUser('ayse');
    await store.multiRemove(['outbox']);
    expect(disk.data.has('u:ayse:outbox')).toBe(false);
  });

  it('eski veriyi taşıma başarısız olursa veri yerinde kalır, sonraki erişimde yeniden denenir', async () => {
    const disk = new MemoryKeyValueStore({ medications: '[]', healthConsent: '{}' });
    const store = new UserScopedStore(disk);
    store.setUser('ayse');
    disk.failWrites = true;
    await expect(store.getItem('medications')).rejects.toThrow();
    expect(disk.data.get('medications')).toBe('[]');

    disk.failWrites = false;
    expect(await store.getItem('medications')).toBe('[]');
    expect(await store.getItem('healthConsent')).toBe('{}');
    expect(disk.data.has('medications')).toBe(false);
  });
});

describe('AccountSession', () => {
  function setup(lastUser: Record<string, string> = {}) {
    const disk = new MemoryKeyValueStore(lastUser);
    const deps = {
      store: { setUser: jest.fn() },
      device: { reset: jest.fn() },
      sync: { stop: jest.fn().mockResolvedValue(undefined), setOwner: jest.fn() },
      reminders: { clearAll: jest.fn().mockResolvedValue(undefined) },
      lastUser: disk,
    };
    return { deps, disk, session: new AccountSession(deps) };
  }

  it('aynı hesap için tekrar çağrı bir şey yapmaz; çağrılar sırayla işlenir', async () => {
    const { deps, session } = setup();
    await Promise.all([session.activate('ayse'), session.activate('ayse')]);
    expect(deps.store.setUser).toHaveBeenCalledTimes(1);
    expect(deps.reminders.clearAll).not.toHaveBeenCalled();
  });

  it('önceki açılışta başka biri girdiyse onun hatırlatmaları kaldırılır', async () => {
    const { deps, disk, session } = setup({ activeUser: 'mehmet' });
    await session.activate('ayse');
    expect(deps.reminders.clearAll).toHaveBeenCalledTimes(1);
    expect(disk.data.get('activeUser')).toBe('ayse');
  });

  it('bir geçiş hata verse de sonraki geçiş çalışır', async () => {
    const { deps, session } = setup();
    deps.sync.stop.mockRejectedValueOnce(new Error('durmadı'));
    await expect(session.activate('ayse')).rejects.toThrow('durmadı');
    await session.activate('ayse');
    expect(deps.store.setUser).toHaveBeenCalledWith('ayse');
  });
});
