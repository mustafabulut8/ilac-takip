import { AuthError } from '@/errors';

import { toAuthError } from '../auth-errors';

describe('toAuthError: oturum süresi', () => {
  const EXPIRED = 'Oturumunuz kapanmış. Lütfen yeniden giriş yapın.';

  it.each([
    { name: 'AuthSessionMissingError', message: 'Auth session missing!' },
    { code: 'session_expired' },
    { code: 'session_not_found' },
    { code: 'refresh_token_not_found' },
    { code: 'refresh_token_already_used' },
    { code: 'bad_jwt' },
    { code: 'PGRST301' },
    { code: 'PGRST303' },
  ])('%o süresi dolmuş oturum olarak anlatılır', (error) => {
    const result = toAuthError(error);
    expect(result).toBeInstanceOf(AuthError);
    expect(result.kind).toBe('session_expired');
    expect(result.userMessage).toBe(EXPIRED);
  });
});
