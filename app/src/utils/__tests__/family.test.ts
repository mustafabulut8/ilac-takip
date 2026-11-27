import { makeMedication } from '@/test-utils/fakes';

import { initialsOf, missedAlertOf } from '../family';

const NOW = new Date(2026, 10, 27, 9, 45);

describe('missedAlertOf (kırmızı uyarı kartı)', () => {
  const dose = {
    medication: makeMedication({ name: 'Metformin', dose: '1000 mg' }),
    date: '2026-11-27',
    time: '09:00',
    status: 'kacirildi' as const,
  };

  it('yakınlıkla, saatle ve geçen süreyle yazar', () => {
    expect(missedAlertOf(dose, 'Annem', NOW)).toEqual({
      title: 'Annem 09:00 dozunu almadı',
      detail: 'Metformin 1000 mg · 45 dakika geçti',
    });
  });

  it('bir saati geçince saat olarak yazar', () => {
    expect(missedAlertOf(dose, 'Babam', new Date(2026, 10, 27, 11, 30)).detail).toBe(
      'Metformin 1000 mg · 2 saat geçti',
    );
  });
});

describe('initialsOf', () => {
  it('ad ve soyadın baş harfleri, Türkçe büyük harfle', () => {
    expect(initialsOf('fatma bulut')).toBe('FB');
    expect(initialsOf('İsmail')).toBe('İ');
    expect(initialsOf('  ')).toBe('');
  });
});
