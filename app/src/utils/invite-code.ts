/** Davet kodundaki rakam sayısı. */
export const INVITE_CODE_LENGTH = 6;

/** Yazılan metinden kodun rakamları (boşluk ve diğer işaretler atılır). */
export function digitsOf(text: string) {
  return text.replace(/\D/g, '').slice(0, INVITE_CODE_LENGTH);
}

/** Okunması kolay olsun diye üçer rakam: "482913" → "482 913". */
export function formatInviteCode(code: string) {
  return `${code.slice(0, 3)} ${code.slice(3)}`.trim();
}
