/**
 * Yaşlı kullanıcılar için tek, yüksek kontrastlı tema.
 * Gövde 18pt, en küçük yazı 16pt, ana buton 56pt, dokunma alanı en az 48pt.
 */

export const Colors = {
  text: '#000000',
  // İkincil (gri) yazı; daha açık gri kullanılmaz.
  textSecondary: '#3D4947',
  textOnColor: '#FFFFFF',
  // Vurgu rengi üzerinde beyaz yazı 2,9:1'de kalıyor; siyah 7,3:1 veriyor.
  textOnAccent: '#000000',
  background: '#F7F7F5',
  card: '#FFFFFF',
  surface: '#F2F2F2',
  border: '#000000',
  // Tüm ana butonlar (beyaz yazıyla) ve açık zemindeki renkli yazılar.
  primary: '#0F6E6E',
  // Yalnızca vurgu: ilerleme halkası, seçili çerçeve, etiket zemini. Yazı rengi olamaz.
  accent: '#3FA89A',
  success: '#0B6B2E',
  danger: '#A80000',
  // Amber: uyarı ve bekleyen doz.
  pending: '#8D5100',
} as const;

export const FontSize = {
  small: 16,
  body: 18,
  title: 30,
  huge: 44,
} as const;

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

export const Radius = {
  button: 16,
  card: 20,
  // Etiketler tam yuvarlaktır.
  pill: 9999,
} as const;

/** Değerler Stitch tasarımından alındı. */
export const Shadow = {
  card: '0px 4px 16px rgba(0, 0, 0, 0.05)',
  primaryButton: '0px 4px 12px rgba(63, 168, 154, 0.25)',
} as const;

export const MinButtonHeight = 56;

/** Ana buton olmayan dokunulabilir ögeler için alt sınır. */
export const MinTouchSize = 48;
