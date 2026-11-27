import { digitsOf, formatInviteCode } from '../invite-code';

describe('davet kodu biçimi', () => {
  it('altı rakam ortadan bölünür: 482913 → "482 913"', () => {
    expect(formatInviteCode('482913')).toBe('482 913');
  });

  it('yazılan metinden yalnızca rakamlar alınır, en çok altı', () => {
    expect(digitsOf(' 482 913 ')).toBe('482913');
    expect(digitsOf('48-29a13999')).toBe('482913');
  });
});
