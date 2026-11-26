/**
 * Yaşlı kullanıcılar için tek, yüksek kontrastlı tema.
 * Gövde 18pt, en küçük yazı 16pt, ana buton 56pt, dokunma alanı en az 48pt.
 */

export const Colors = {
  text: '#000000',
  // Onay penceresinin arkasındaki karartma.
  overlay: 'rgba(0, 0, 0, 0.5)',
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
  success: '#2E7D32',
  danger: '#C62828',
  // Amber: uyarı ve bekleyen doz.
  pending: '#8D5100',
  // Etiket ve uyarı zeminleri (Stitch).
  successSoft: '#E8F5E9',
  dangerSoft: '#FFEBEE',
  warningSoft: '#FFF8E1',
  warningIcon: '#FFE082',
  accentSoft: '#9EEDED',
  primarySoft: '#E6F4F3',
  // Rol seçiminde seçili kartın zemini (arayuz-tasarimi.md, 2. tur farkları).
  selectedSoft: '#E6F2F2',
  neutralSoft: '#F0EDED',
  neutralStrong: '#EAE7E7',
  hairline: '#DDD9D9',
  // Geçmiş takviminin gün renkleri (Stitch).
  dayAll: '#A3F69C',
  onDayAll: '#003909',
  daySome: '#FEF3C7',
  dayNone: '#FFDAD6',
  onDayNone: '#93000A',
} as const;

export const FontSize = {
  small: 16,
  body: 18,
  // Sade modda en küçük yazı 20pt (arayuz-tasarimi.md, 2. tur farkları).
  large: 20,
  subtitle: 22,
  heading: 26,
  action: 28,
  title: 30,
  display: 34,
  huge: 44,
} as const;

/** Inter; ağırlık `fontWeight` ile değil aile adıyla seçilir. */
export const FontFamily = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  screen: 20,
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
  activeCard: '0px 6px 20px rgba(63, 168, 154, 0.18)',
  primaryButton: '0px 4px 12px rgba(63, 168, 154, 0.25)',
} as const;

export const MinButtonHeight = 56;

/** Ana buton olmayan dokunulabilir ögeler için alt sınır. */
export const MinTouchSize = 48;
