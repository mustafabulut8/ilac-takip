import { AuthError, type AuthErrorKind } from '@/errors';

/** Supabase ve ağ hatalarından okunan alanlar. */
type ErrorLike = { name?: unknown; code?: unknown; status?: unknown; message?: unknown };

type ErrorRule = { kind: AuthErrorKind; userMessage: string };

export const OFFLINE_MESSAGE =
  'İnternet bağlantısı yok. Bağlantınızı kontrol edip yeniden deneyin.';

const EMAIL_TAKEN: ErrorRule = {
  kind: 'email_taken',
  userMessage: 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.',
};
const RATE_LIMITED: ErrorRule = {
  kind: 'rate_limited',
  userMessage: 'Çok fazla deneme yapıldı. Birkaç dakika sonra yeniden deneyin.',
};

/**
 * Supabase hata kodu → hata türü ve Türkçe mesaj. Açık/kapalı ilkesi: yeni bir kod
 * yalnızca bu tabloya satır eklenerek tanıtılır, çeviren fonksiyon değişmez.
 */
const RULES_BY_CODE: Readonly<Record<string, ErrorRule>> = {
  invalid_credentials: {
    kind: 'invalid_credentials',
    userMessage: 'E-posta adresi veya şifre yanlış.',
  },
  user_already_exists: EMAIL_TAKEN,
  email_exists: EMAIL_TAKEN,
  weak_password: {
    kind: 'weak_password',
    userMessage: 'Şifre çok zayıf. Harf ve rakam içeren, en az 8 karakterli bir şifre seçin.',
  },
  email_address_invalid: { kind: 'invalid_email', userMessage: 'E-posta adresi geçerli değil.' },
  over_request_rate_limit: RATE_LIMITED,
  over_email_send_rate_limit: RATE_LIMITED,
};

const OFFLINE_RULE: ErrorRule = { kind: 'offline', userMessage: OFFLINE_MESSAGE };
const UNKNOWN_RULE: ErrorRule = {
  kind: 'unknown',
  userMessage: 'Bir sorun oluştu. Lütfen biraz sonra yeniden deneyin.',
};

const NETWORK_MESSAGE = /network request failed|failed to fetch|network ?error/i;

function isOffline({ name, status }: ErrorLike, text: string) {
  return name === 'AuthRetryableFetchError' || status === 0 || NETWORK_MESSAGE.test(text);
}

function ruleOf(error: ErrorLike, text: string): ErrorRule {
  if (isOffline(error, text)) return OFFLINE_RULE;
  const byCode = typeof error.code === 'string' ? RULES_BY_CODE[error.code] : undefined;
  return byCode ?? UNKNOWN_RULE;
}

/** Supabase veya ağ hatasını kullanıcıya gösterilecek Türkçe mesajlı AuthError'a çevirir. */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const fields = (error ?? {}) as ErrorLike;
  const text = typeof fields.message === 'string' ? fields.message : '';
  const technical = `${String(fields.name ?? 'Hata')} ${String(fields.code ?? '')}: ${text}`.trim();
  const { kind, userMessage } = ruleOf(fields, text);
  return new AuthError(kind, technical, userMessage, { cause: error });
}
