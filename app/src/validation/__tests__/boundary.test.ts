import { AuthError } from '@/errors';
import { logger } from '@/utils/logger';

import { ProfileCache, type ProfileCacheStore } from '@/services/ProfileCache';
import { ProfileRepository, type ProfilesBackend } from '@/services/ProfileRepository';

// Sunucudan ve cihazdan okunan profil verisinin sınır davranışı (karakterizasyon).
const ROW = { id: 'k1', ad: 'Ayşe', rol: 'sade', olusturma_zamani: '2026-11-26T08:00:00Z' };

function repositoryReturning(row: unknown) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: row, error: null }),
  };
  return new ProfileRepository({ from: () => query } as unknown as ProfilesBackend);
}

function cacheWith(raw: string | null) {
  const store: ProfileCacheStore = {
    getItem: async () => raw,
    setItem: async () => {},
    removeItem: async () => {},
  };
  return new ProfileCache(store);
}

describe('sunucudan gelen profil satırı', () => {
  it('geçerli satır uygulama alanlarına çevrilir', async () => {
    await expect(repositoryReturning(ROW).fetch('k1')).resolves.toEqual({
      id: 'k1',
      name: 'Ayşe',
      role: 'sade',
      createdAt: '2026-11-26T08:00:00Z',
    });
  });

  it.each([
    ['rol geçersiz', { ...ROW, rol: 'yonetici' }],
    ['ad yok', { ...ROW, ad: null }],
    ['satır nesne değil', 'metin'],
  ])('%s: çökmez, profile_missing hatası verir ve kaydeder', async (_case, row) => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const result = repositoryReturning(row).fetch('k1');
    await expect(result).rejects.toBeInstanceOf(AuthError);
    await expect(result).rejects.toMatchObject({ kind: 'profile_missing' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('cihazdaki profil kopyası', () => {
  const saved = { id: 'k1', name: 'Ayşe', role: 'aile', createdAt: '2026-11-26T08:00:00Z' };

  it('aynı kullanıcının geçerli kopyası okunur; kayıt anı yoksa boş metin olur', async () => {
    await expect(cacheWith(JSON.stringify(saved)).read('k1')).resolves.toEqual(saved);
    const { createdAt: _createdAt, ...withoutDate } = saved;
    await expect(cacheWith(JSON.stringify(withoutDate)).read('k1')).resolves.toEqual({
      ...withoutDate,
      createdAt: '',
    });
  });

  it.each([
    ['yok', null],
    ['bozuk JSON', '{'],
    ['dizi', '[]'],
    ['başka kullanıcının', JSON.stringify({ ...saved, id: 'k2' })],
    ['adı sayı', JSON.stringify({ ...saved, name: 5 })],
  ])('%s: güvenli varsayılan null', async (_case, raw) => {
    await expect(cacheWith(raw).read('k1')).resolves.toBeNull();
  });
});
