import { Colors, FontSize, MinButtonHeight, MinTouchSize } from '@/constants/theme';

/** WCAG 2 göreli parlaklık. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe('tema kontrastı (WCAG AA, en az 4,5:1)', () => {
  it.each([
    ['textOnColor', 'primary'],
    ['textOnColor', 'success'],
    ['textOnColor', 'danger'],
    ['textOnColor', 'pending'],
    ['textOnAccent', 'accent'],
    ['text', 'background'],
    ['text', 'surface'],
    ['text', 'card'],
    ['textSecondary', 'background'],
    ['textSecondary', 'card'],
    ['textSecondary', 'surface'],
    ['primary', 'background'],
    ['primary', 'card'],
    ['success', 'background'],
    ['success', 'card'],
    ['danger', 'background'],
    ['danger', 'card'],
    ['pending', 'background'],
    ['pending', 'card'],
    ['success', 'successSoft'],
    ['danger', 'dangerSoft'],
    ['text', 'warningSoft'],
    ['pending', 'warningSoft'],
    ['text', 'accentSoft'],
    ['primary', 'primarySoft'],
    ['textSecondary', 'neutralSoft'],
    ['onDayAll', 'dayAll'],
    ['text', 'daySome'],
    ['onDayNone', 'dayNone'],
    ['textSecondary', 'neutralStrong'],
  ] as const)('%s yazısı %s zemininde okunur', (text, background) => {
    expect(contrast(Colors[text], Colors[background])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('tema renk kararları', () => {
  it('ana buton, amber ve ikincil yazı kararlaştırılan renklerdir', () => {
    expect(Colors.primary).toBe('#0F6E6E');
    expect(Colors.accent).toBe('#3FA89A');
    expect(Colors.pending).toBe('#8D5100');
    expect(Colors.textSecondary).toBe('#3D4947');
    expect(Colors.success).toBe('#2E7D32');
    expect(Colors.danger).toBe('#C62828');
  });

  it('vurgu rengi beyaz yazı için yeterli değildir', () => {
    expect(contrast(Colors.textOnColor, Colors.accent)).toBeLessThan(4.5);
  });
});

describe('tema ölçüleri', () => {
  it('en küçük yazı 16, gövde 18, başlık 30 olur', () => {
    expect(Math.min(...Object.values(FontSize))).toBe(16);
    expect(FontSize.body).toBe(18);
    expect(FontSize.title).toBe(30);
  });

  it('ana buton 56, dokunma alanı en az 48 olur', () => {
    expect(MinButtonHeight).toBe(56);
    expect(MinTouchSize).toBeGreaterThanOrEqual(48);
  });
});
