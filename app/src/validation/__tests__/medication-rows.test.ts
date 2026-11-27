import { makeMedication } from '@/test-utils/fakes';

import { parseMedicationRow, toMedicationRow } from '../medication-rows';

describe('ilaç satırı eşlemesi (sunucu ↔ telefon)', () => {
  it('ilaç satıra çevrilip geri okununca aynı kalır', () => {
    const medication = makeMedication({ photoPath: 'sahip/ilac1.jpg', pastPlans: [] });
    const row = toMedicationRow(medication, 'sahip');
    expect(row).toMatchObject({
      id: 'ilac1',
      owner_id: 'sahip',
      photo_path: 'sahip/ilac1.jpg',
      updated_at: medication.updatedAt,
      deleted_at: null,
    });
    expect(parseMedicationRow(row)).toEqual({ ...medication, photoFile: '' });
  });

  it('telefondaki dosya adı sunucuya gitmez; fotoğraf yoksa yol null olur', () => {
    const row = toMedicationRow(makeMedication({ photoFile: 'yerel.jpg', photoPath: '' }), 'sahip');
    expect(row).not.toHaveProperty('photo_file');
    expect(row.photo_path).toBeNull();
  });

  it('sunucunun mikro saniyeli zaman biçimini okur', () => {
    const row = {
      ...toMedicationRow(makeMedication(), 'sahip'),
      updated_at: '2026-11-27T08:00:00.123456+00:00',
    };
    expect(parseMedicationRow(row)?.updatedAt).toBe('2026-11-27T08:00:00.123456+00:00');
  });

  it('kimliği veya adı olmayan satır kullanılamaz', () => {
    expect(parseMedicationRow(null)).toBeNull();
    expect(parseMedicationRow({ id: 'a' })).toBeNull();
  });
});
