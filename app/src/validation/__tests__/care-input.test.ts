import { ValidationError } from '@/errors';

import { parseCareLinkRow, validateRedeem } from '../care-input';

describe('validateRedeem', () => {
  it('boşluklu kodu ve etiketi temizleyip döner', () => {
    expect(validateRedeem({ code: '482 913', relationLabel: '  Annem ' })).toEqual({
      code: '482913',
      relationLabel: 'Annem',
    });
  });

  it('eksik kod ve boş etiket alan alan Türkçe hata verir', () => {
    try {
      validateRedeem({ code: '4829', relationLabel: ' ' });
      throw new Error('hata bekleniyordu');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields).toEqual({
        code: 'Kod 6 rakamdan oluşur.',
        relationLabel: 'Yakınlığınızı seçin veya yazın.',
      });
    }
  });

  it('40 karakterden uzun etiket kabul edilmez', () => {
    expect(() => validateRedeem({ code: '482913', relationLabel: 'x'.repeat(41) })).toThrow(
      ValidationError,
    );
  });
});

describe('parseCareLinkRow', () => {
  const row = {
    id: 'l1',
    relation_label: 'Annem',
    created_at: '2026-11-27T09:00:00Z',
    caregiver: { id: 'aile', ad: 'Ayşe', rol: 'aile' },
    patient: { id: 'yasli', ad: 'Fatma', rol: 'sade' },
  };

  it('aile tarafından bakınca karşı taraf takip edilen kişidir', () => {
    expect(parseCareLinkRow(row, 'aile')).toEqual({
      id: 'l1',
      personId: 'yasli',
      name: 'Fatma',
      role: 'sade',
      relationLabel: 'Annem',
      createdAt: '2026-11-27T09:00:00Z',
    });
  });

  it('takip edilen tarafından bakınca karşı taraf aile üyesidir', () => {
    expect(parseCareLinkRow(row, 'yasli')).toMatchObject({ personId: 'aile', name: 'Ayşe' });
  });

  it('karşı tarafın profili okunamıyorsa satır kullanılamaz', () => {
    expect(parseCareLinkRow({ ...row, patient: null }, 'aile')).toBeNull();
    expect(parseCareLinkRow('bozuk', 'aile')).toBeNull();
  });
});
