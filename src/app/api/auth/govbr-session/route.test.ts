import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/govbr-session', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/govbr-session', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('grava o JWT em cookie httpOnly com as mesmas opções do login tradicional', async () => {
    const res = await POST(makeRequest({ token: 'jwt-govbr-123' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('token=jwt-govbr-123');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Max-Age=604800');
    expect(setCookie).toContain('Expires=');
    // NODE_ENV de teste não é 'production', então o cookie não vai com Secure.
    expect(setCookie).not.toContain('Secure');
  });

  it('marca o cookie como Secure em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const res = await POST(makeRequest({ token: 'jwt-prod' }));

    expect(res.headers.get('set-cookie')).toContain('Secure');
  });

  it('devolve 400 quando o token está ausente', async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Token ausente' });
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('devolve 400 quando o token é vazio', async () => {
    const res = await POST(makeRequest({ token: '' }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Token ausente' });
  });

  it('devolve 400 quando o token não é uma string', async () => {
    const res = await POST(makeRequest({ token: 12345 }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Token ausente' });
  });
});
