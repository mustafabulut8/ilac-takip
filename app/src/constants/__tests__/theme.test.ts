import { Colors } from '@/constants/theme';

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
    ['primary', 'background'],
    ['success', 'background'],
    ['danger', 'background'],
    ['pending', 'background'],
  ] as const)('%s yazısı %s zemininde okunur', (text, background) => {
    expect(contrast(Colors[text], Colors[background])).toBeGreaterThanOrEqual(4.5);
  });
});
