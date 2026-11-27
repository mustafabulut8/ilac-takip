import { CURRENT_SCHEMA_VERSION, MIGRATIONS, runMigrations } from '../migrations';

describe('göç v3: eşitleme alanları', () => {
  it('son değişiklik anı kayıt anı olur, sunucudaki fotoğraf yolu boştur', () => {
    const createdAt = '2026-11-01T08:00:00.000Z';
    const { medications } = runMigrations(
      { medications: [{ id: 'a', name: 'A', createdAt }], doseLogs: [] },
      2,
    );
    expect(medications[0]).toMatchObject({ updatedAt: createdAt, photoPath: '' });
  });

  it('kayıtta olan alanın üzerine yazmaz', () => {
    const record = { id: 'a', createdAt: 'x', updatedAt: 'y', photoPath: 'kisi/a.jpg' };
    const { medications } = runMigrations({ medications: [record], doseLogs: [] }, 2);
    expect(medications[0]).toEqual(record);
  });

  it('güncel sürüm 3', () => {
    expect(MIGRATIONS.find((migration) => migration.version === 3)).toBeDefined();
  });
});

describe('göç v4: kullanıcıya özel anahtarlar', () => {
  it('kayıtların biçimi değişmez; güncel sürüm 4 (taşımayı UserScopedStore yapar)', () => {
    const data = { medications: [{ id: 'a', name: 'X' }], doseLogs: [{ id: 'd' }] };
    expect(runMigrations(data, 3)).toEqual(data);
    expect(CURRENT_SCHEMA_VERSION).toBe(4);
  });
});
