import { serialize } from 'cookie';
import { decodeJwt } from 'jose';

// Validade padrão do cookie quando o token não informa `exp` (tokens
// antigos). O backend emite tokens de 12h (JWT_EXPIRES_IN).
const FALLBACK_SECONDS = 12 * 60 * 60;

// Cookie de sessão httpOnly com a MESMA validade do token: assim o cookie
// some junto com o token (D19), em vez de ficar 7 dias guardando um token
// que o servidor já recusa.
export function sessionCookie(token: string): string {
  let maxAge = FALLBACK_SECONDS;
  try {
    const { exp } = decodeJwt(token);
    if (typeof exp === 'number') {
      maxAge = Math.max(0, Math.floor(exp - Date.now() / 1000));
    }
  } catch {
    // token ilegível: fica a validade padrão; o proxy recusa se for inválido
  }
  return serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge,
  });
}

export function clearedSessionCookie(): string {
  return serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge: 0,
  });
}
