import { ValidationError } from '@/errors';

import {
  assertValidNewMedication,
  EMPTY_MEDICATION_DRAFT,
  firstInvalidField,
  parseStock,
  toNewMedication,
  validateMedicationDraft,
  type MedicationDraft,
} from '../medication-input';

const validDraft: MedicationDraft = {
  name: '  Aspirin ',
  dose: ' 1 tablet ',
  photo: 'file:///gecici/foto.jpg',
  times: ['20:00', '08:00'],
  stock: '30',
};

describe('validateMedicationDraft', () => {
  it('geçerli taslakta hata yoktur', () => {
    expect(validateMedicationDraft(validDraft)).toEqual({});
  });

  it('boş taslakta her alan için Türkçe mesaj verir', () => {
    expect(validateMedicationDraft(EMPTY_MEDICATION_DRAFT)).toEqual({
      name: 'Lütfen ilacın adını yazın.',
      dose: 'Lütfen dozu yazın. Örnek: 1 tablet',
      photo: 'Lütfen ilacın fotoğrafını ekleyin.',
      times: 'Lütfen saati seçip "Saatini Ekle" butonuna basın.',
      stock: 'Lütfen stok adedini sayı olarak yazın.',
    });
  });

  it('yalnızca boşluktan oluşan ad ve doz kabul edilmez', () => {
    const errors = validateMedicationDraft({ ...validDraft, name: '   ', dose: '\n' });
    expect(Object.keys(errors)).toEqual(['name', 'dose']);
  });

  it('bozuk saat biçimi yakalanır', () => {
    expect(validateMedicationDraft({ ...validDraft, times: ['25:00'] }).times).toBeDefined();
  });

  it.each(['-1', '2.5', '2,5', 'abc', '', ' '])('stok "%s" geçersiz', (stock) => {
    expect(validateMedicationDraft({ ...validDraft, stock }).stock).toBeDefined();
  });

  it('ilk hatalı alan ekran sırasına göre bulunur', () => {
    const errors = validateMedicationDraft({ ...validDraft, stock: '', dose: '' });
    expect(firstInvalidField(errors)).toBe('dose');
    expect(firstInvalidField({})).toBeUndefined();
  });
});

describe('parseStock', () => {
  it('sıfır ve pozitif tam sayıları okur', () => {
    expect(parseStock('0')).toBe(0);
    expect(parseStock(' 30 ')).toBe(30);
  });

  it('negatif, ondalıklı ve çok büyük sayıları reddeder', () => {
    expect(parseStock('-3')).toBeNull();
    expect(parseStock('1.5')).toBeNull();
    expect(parseStock('99999999999999999999')).toBeNull();
  });
});

describe('toNewMedication', () => {
  it('alanları kırpar, saatleri sıralar ve stoğu sayıya çevirir', () => {
    expect(toNewMedication(validDraft)).toEqual({
      name: 'Aspirin',
      dose: '1 tablet',
      times: ['08:00', '20:00'],
      stock: 30,
      photoSourceUri: 'file:///gecici/foto.jpg',
    });
  });

  it('geçersiz taslakta ValidationError fırlatır', () => {
    expect(() => toNewMedication(EMPTY_MEDICATION_DRAFT)).toThrow(ValidationError);
  });
});

describe('assertValidNewMedication', () => {
  const valid = toNewMedication(validDraft);

  it('geçerli girdiyi kabul eder', () => {
    expect(() => assertValidNewMedication(valid)).not.toThrow();
  });

  it('negatif veya ondalıklı stoğu reddeder', () => {
    expect(() => assertValidNewMedication({ ...valid, stock: -1 })).toThrow(ValidationError);
    expect(() => assertValidNewMedication({ ...valid, stock: 1.5 })).toThrow(ValidationError);
  });

  it('bilinmeyen formu reddeder', () => {
    expect(() =>
      assertValidNewMedication({ ...valid, form: 'igne' as unknown as 'tablet' }),
    ).toThrow(ValidationError);
  });

  it('boş saat listesini ve eksik fotoğrafı reddeder', () => {
    expect(() => assertValidNewMedication({ ...valid, times: [] })).toThrow(ValidationError);
    expect(() => assertValidNewMedication({ ...valid, photoSourceUri: '' })).toThrow(
      ValidationError,
    );
  });
});
