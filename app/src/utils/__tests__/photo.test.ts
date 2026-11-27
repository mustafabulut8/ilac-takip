import { MAX_PHOTO_SIDE, photoPathFor, resizeFor } from '../photo';

describe('resizeFor (yüklemeden önce küçültme)', () => {
  it('uzun kenarı 1080 piksele indirir, oran korunur', () => {
    expect(MAX_PHOTO_SIDE).toBe(1080);
    expect(resizeFor({ width: 4032, height: 3024 })).toEqual({ width: 1080 });
    expect(resizeFor({ width: 3024, height: 4032 })).toEqual({ height: 1080 });
  });

  it('zaten küçükse büyütmez', () => {
    expect(resizeFor({ width: 800, height: 600 })).toBeNull();
    expect(resizeFor({ width: 1080, height: 1080 })).toBeNull();
  });
});

describe('photoPathFor', () => {
  it('ilk klasör sahibin kimliği (erişim kuralı buna bakar); ad ilaç kimliği ve zamandır', () => {
    expect(photoPathFor('fatma', 'met', new Date(Date.UTC(2026, 10, 27)))).toBe(
      `fatma/met-${Date.UTC(2026, 10, 27)}.jpg`,
    );
  });
});
