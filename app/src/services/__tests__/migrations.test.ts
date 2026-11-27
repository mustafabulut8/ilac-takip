import { CURRENT_SCHEMA_VERSION, runMigrations } from '../migrations';

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
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
  });
});
