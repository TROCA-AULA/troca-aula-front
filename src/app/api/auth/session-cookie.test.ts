import { describe, it, expect, vi, afterEach } from 'vitest';
import { clearedSessionCookie, sessionCookie } from './session-cookie';

function fakeJwt(payload: Record<string, unknown>) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.assinatura`;
}

describe('sessionCookie', () => {
  afterEach(() => vi.useRealTimers());

  it('o cookie vale o mesmo tempo que falta para o token expirar (D19)', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-10-23T12:00:00Z'));
    const exp = Math.floor(Date.now() / 1000) + 3600;

    const cookie = sessionCookie(fakeJwt({ exp }));

    expect(cookie).toContain('Max-Age=3600');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('sem exp (ou token ilegível), usa 12 horas', () => {
    expect(sessionCookie(fakeJwt({}))).toContain('Max-Age=43200');
    expect(sessionCookie('nao-e-jwt')).toContain('Max-Age=43200');
  });

  it('token já vencido vira cookie de validade zero', () => {
    expect(sessionCookie(fakeJwt({ exp: 1 }))).toContain('Max-Age=0');
  });

  it('o cookie limpo expira na hora', () => {
    expect(clearedSessionCookie()).toMatch(/^token=;.*Max-Age=0/);
  });
});
