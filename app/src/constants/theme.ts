/**
 * Yaşlı kullanıcılar için tek, yüksek kontrastlı tema.
 * Yazılar en az 22pt, butonlar en az 64px yüksekliğindedir.
 */

export const Colors = {
  text: '#000000',
  textOnColor: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F2F2F2',
  border: '#000000',
  primary: '#0B3D91',
  success: '#0B6B2E',
  danger: '#A80000',
  pending: '#7A4B00',
} as const;

export const FontSize = {
  small: 22,
  body: 24,
  title: 32,
  huge: 44,
} as const;

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

export const MinButtonHeight = 64;
