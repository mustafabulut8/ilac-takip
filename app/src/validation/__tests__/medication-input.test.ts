import { ValidationError } from '@/errors';
import {
  doseTextOf,
  draftFromMedication,
  EMPTY_MEDICATION_DRAFT,
  type MedicationDraft,
} from '@/models';
import { makeMedication } from '@/test-utils/fakes';

import {
  assertValidChanges,
  assertValidNewMedication,
  changesOf,
  toNewMedication,
  validateMedicationDraft,
} from '../medication-input';

const validDraft: MedicationDraft = {
  ...EMPTY_MEDICATION_DRAFT,
  photo: 'file:///gecici/foto.jpg',
  name: '  Aspirin ',
  form: 'tablet',
  dose: { amount: 0.5, unit: 'adet', location: '', text: '' },
  times: ['20:00', '08:00', '20:00'],
  mealTiming: 'full',
  stock: 30,
};

describe('validateMedicationDraft', () => {
  it('geçerli taslakta hata yoktur; fotoğraf isteğe bağlıdır', () => {
    expect(validateMedicationDraft(validDraft)).toEqual({});
    expect(validateMedicationDraft({ ...validDraft, photo: null })).toEqual({});
  });

  it('boş taslakta zorunlu alanlar için Türkçe mesaj verir', () => {
    expect(validateMedicationDraft(EMPTY_MEDICATION_DRAFT)).toEqual({
      name: 'Lütfen ilacın adını yazın.',
      form: 'Lütfen ilacın şeklini seçin.',
      times: 'Lütfen en az bir saat ekleyin.',
      mealTiming: 'Lütfen birini seçin.',
    });
  });

  it('yalnızca boşluktan oluşan ad kabul edilmez', () => {
    expect(Object.keys(validateMedicationDraft({ ...validDraft, name: '   ' }))).toEqual(['name']);
  });

  it('bozuk saat, gün, süre ve miktar yakalanır', () => {
    const errorOf = (changes: Partial<MedicationDraft>) =>
      Object.keys(validateMedicationDraft({ ...validDraft, ...changes }));
    expect(errorOf({ times: ['25:00'] })).toEqual(['times']);
    expect(errorOf({ schedule: { kind: 'weekdays', days: [] } })).toEqual(['schedule']);
    expect(errorOf({ schedule: { kind: 'weekdays', days: [7] } })).toEqual(['schedule']);
    expect(errorOf({ duration: { kind: 'days', count: 0 } })).toEqual(['duration']);
    expect(errorOf({ duration: { kind: 'days', count: 91 } })).toEqual(['duration']);
    expect(errorOf({ dose: { ...validDraft.dose, amount: 0 } })).toEqual(['dose']);
  });

  it.each([-1, 2.3, 1000, Number.NaN])('stok %p geçersiz', (stock) => {
    expect(validateMedicationDraft({ ...validDraft, stock }).stock).toBeDefined();
  });

  it.each([0, 9.5, 999])('stok %p geçerli', (stock) => {
    expect(validateMedicationDraft({ ...validDraft, stock }).stock).toBeUndefined();
  });
});

describe('toNewMedication', () => {
  it('alanları kırpar, saatleri sıralar ve doz metnini kurar', () => {
    expect(toNewMedication(validDraft)).toEqual({
      name: 'Aspirin',
      form: 'tablet',
      dose: 'Yarım tablet',
      amount: 0.5,
      unit: 'adet',
      location: '',
      times: ['08:00', '20:00'],
      schedule: { kind: 'daily' },
      duration: { kind: 'continuous' },
      mealTiming: 'full',
      stock: 30,
      lowStockThreshold: 5,
      markedLow: false,
      photoSourceUri: 'file:///gecici/foto.jpg',
    });
  });

  it('yedi günün hepsi seçilirse "her gün" olur', () => {
    const days = [1, 2, 3, 4, 5, 6, 0];
    const result = toNewMedication({ ...validDraft, schedule: { kind: 'weekdays', days } });
    expect(result.schedule).toEqual({ kind: 'daily' });
  });

  it('geçersiz taslakta ValidationError fırlatır', () => {
    expect(() => toNewMedication(EMPTY_MEDICATION_DRAFT)).toThrow(ValidationError);
  });
});

describe('düzenleme', () => {
  it('değişmeyen taslaktan değişiklik çıkmaz', () => {
    const medication = makeMedication();
    expect(changesOf(medication, draftFromMedication(medication))).toEqual({});
  });

  it('yalnızca değişen alanı gönderir', () => {
    const medication = makeMedication();
    const draft = { ...draftFromMedication(medication), name: 'Yeni ad' };
    expect(changesOf(medication, draft)).toEqual({ name: 'Yeni ad' });
  });

  it('eski serbest doz metni kullanıcı değiştirene kadar korunur', () => {
    const medication = makeMedication({ dose: '500 mg' });
    const draft = draftFromMedication(medication);
    expect(doseTextOf(draft)).toBe('500 mg');
    expect(changesOf(medication, draft)).toEqual({});
    expect(changesOf(medication, { ...draft, keptDose: null })).toEqual({ dose: '1 tablet' });
  });

  it('fotoğraf: yeni seçilen gönderilir, kaldırılan null olur', () => {
    const medication = makeMedication();
    const draft = draftFromMedication(medication);
    expect(changesOf(medication, { ...draft, photo: 'file:///y.jpg' })).toEqual({
      photoSourceUri: 'file:///y.jpg',
    });
    expect(changesOf(medication, { ...draft, photoFile: '' })).toEqual({ photoSourceUri: null });
  });

  it('yalnızca sunucuda olan fotoğraf (aile ekledi) taslakta görünür ve kaldırılabilir', () => {
    const medication = makeMedication({ photoFile: '', photoPath: 'fatma/ilac1-1.jpg' });
    const draft = draftFromMedication(medication);
    expect(draft.photoPath).toBe('fatma/ilac1-1.jpg');
    expect(changesOf(medication, draft)).toEqual({});
    expect(changesOf(medication, { ...draft, photoPath: '' })).toEqual({ photoSourceUri: null });
  });

  it('form seçilmemişse doz metni boştur', () => {
    expect(doseTextOf(EMPTY_MEDICATION_DRAFT)).toBe('');
  });
});

describe('servis doğrulaması', () => {
  const valid = toNewMedication(validDraft);

  it('geçerli girdiyi kabul eder', () => {
    expect(() => assertValidNewMedication(valid)).not.toThrow();
  });

  it.each([
    { stock: -1 },
    { stock: 1.3 },
    { form: 'igne' as unknown as 'tablet' },
    { times: [] },
    { dose: ' ' },
    { amount: 0 },
    { mealTiming: 'x' as unknown as 'any' },
    { schedule: { kind: 'weekdays' as const, days: [] } },
    { duration: { kind: 'days' as const, count: 0 } },
  ])('geçersiz alanı reddeder: %p', (changes) => {
    expect(() => assertValidNewMedication({ ...valid, ...changes })).toThrow(ValidationError);
    expect(() => assertValidChanges(changes)).toThrow(ValidationError);
  });

  it('yeni kayıtta eksik alanı reddeder, güncellemede etmez', () => {
    const { name: _name, ...withoutName } = valid;
    expect(() => assertValidNewMedication(withoutName as typeof valid)).toThrow(ValidationError);
    expect(() => assertValidChanges({})).not.toThrow();
  });
});

// Karakterizasyon: assertValidChanges alan tablosuna bölünmeden önce hangi alana hangi
// mesajın yazıldığını kilitler.
describe('assertValidChanges alan mesajları (karakterizasyon)', () => {
  const fieldsOf = (changes: Parameters<typeof assertValidChanges>[0]) => {
    try {
      assertValidChanges(changes);
      return {};
    } catch (error) {
      return (error as ValidationError).fields;
    }
  };

  it.each([
    [{ name: '  ' }, { name: 'Lütfen ilacın adını yazın.' }],
    [{ name: undefined }, { name: 'Lütfen ilacın adını yazın.' }],
    [{ dose: '' }, { dose: 'Lütfen dozu yazın.' }],
    [{ amount: 0 }, { dose: 'Lütfen geçerli bir miktar seçin.' }],
    [{ amount: Number.NaN }, { dose: 'Lütfen geçerli bir miktar seçin.' }],
    [{ form: 'hap' as never }, { form: 'İlaç formu geçersiz.' }],
    [{ times: [] }, { times: 'Lütfen en az bir saat ekleyin.' }],
    [{ times: ['25:00'] }, { times: 'Saatlerden biri geçersiz. Lütfen kaldırıp yeniden ekleyin.' }],
    [{ schedule: { kind: 'weekdays', days: [] } }, { schedule: 'Lütfen en az bir gün seçin.' }],
    [
      { duration: { kind: 'days', count: 91 } },
      { duration: 'Lütfen 1 ile 90 arasında bir gün sayısı seçin.' },
    ],
    [{ mealTiming: 'gece' as never }, { mealTiming: 'Lütfen birini seçin.' }],
    [{ mealTiming: undefined }, { mealTiming: 'Lütfen birini seçin.' }],
    [{ stock: -1 }, { stock: 'Lütfen 0 ile 999 arasında bir adet girin.' }],
    [{ stock: undefined }, { stock: 'Lütfen 0 ile 999 arasında bir adet girin.' }],
  ] as const)('%j → %j', (changes, expected) => {
    expect(fieldsOf(changes as never)).toEqual(expected);
  });

  it('miktar hatası doz hatasının yerine yazılır; birden çok alan birlikte döner', () => {
    expect(fieldsOf({ dose: '', amount: 0, name: '' })).toEqual({
      name: 'Lütfen ilacın adını yazın.',
      dose: 'Lütfen geçerli bir miktar seçin.',
    });
  });

  it('geçerli değişiklikler ve verilmeyen sıklık/süre hata vermez', () => {
    expect(
      fieldsOf({
        name: 'A',
        dose: '1',
        amount: 0.5,
        form: 'syrup',
        times: ['08:00'],
        schedule: { kind: 'daily' },
        duration: { kind: 'continuous' },
        mealTiming: 'full',
        stock: 0,
      }),
    ).toEqual({});
    expect(fieldsOf({ schedule: undefined, duration: undefined })).toEqual({});
  });
});
