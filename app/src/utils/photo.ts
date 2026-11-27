/** Yüklemeden önce fotoğrafın uzun kenarı en fazla bu kadar piksel olur. */
export const MAX_PHOTO_SIDE = 1080;
/** JPEG kalitesi (0–1). */
export const PHOTO_QUALITY = 0.7;

/** Küçültme ölçüsü: uzun kenar `MAX_PHOTO_SIDE`'a iner, oran korunur; küçükse `null`. */
export function resizeFor(size: { width: number; height: number }) {
  if (Math.max(size.width, size.height) <= MAX_PHOTO_SIDE) return null;
  return size.width >= size.height ? { width: MAX_PHOTO_SIDE } : { height: MAX_PHOTO_SIDE };
}

/**
 * Sunucudaki yol: `{sahip}/{ilaç}-{zaman}.jpg`. İlk klasör sahibi söyler; erişim kuralı
 * (sahip ve bağlı aile) buna bakar. Zaman, değişen fotoğrafın eski önbelleğe takılmamasını sağlar.
 */
export function photoPathFor(ownerId: string, medicationId: string, now: Date) {
  return `${ownerId}/${medicationId}-${now.getTime()}.jpg`;
}
