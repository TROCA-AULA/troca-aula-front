// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';

const { cookieGet, apiPost } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  apiPost: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: cookieGet }) }));
vi.mock('@/api.service', () => ({ default: { post: apiPost } }));

import { GET } from './route';

const secret = new TextEncoder().encode('s0//P4$$w0rD');
async function token(sub: Record<string, unknown>) {
  return new SignJWT({ sub } as never)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}
const req = (query = '') => new NextRequest(`http://localhost/api/auth/me${query}`);

describe('GET /api/auth/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sem cookie responde 401', async () => {
    cookieGet.mockReturnValue(undefined);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('lê os dados do token atual quando não pede renovação', async () => {
    cookieGet.mockReturnValue({
      value: await token({
        id: 7,
        name: 'Ana',
        subjectId: 2,
        upsUser: [{ profileId: 3, schoolId: 10, approvedAt: 'x', networkId: 1 }],
      }),
    });

    const res = await GET(req());
    const body = await res.json();

    expect(apiPost).not.toHaveBeenCalled();
    expect(body).toMatchObject({ id: 7, subjectId: 2, profileId: 3, schoolId: 10 });
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('com refresh=1 troca o token e devolve os dados novos (D23)', async () => {
    cookieGet.mockReturnValue({ value: await token({ id: 7, subjectId: null, upsUser: [] }) });
    const novo = await token({ id: 7, subjectId: 5, residenceNetworkId: 3, upsUser: [] });
    apiPost.mockResolvedValue({ data: { access_token: novo } });

    const res = await GET(req('?refresh=1'));
    const body = await res.json();

    expect(apiPost).toHaveBeenCalledWith('/auth/refresh', undefined, {
      headers: { Authorization: expect.stringMatching(/^Bearer /) },
    });
    expect(body).toMatchObject({ subjectId: 5, residenceNetworkId: 3, schoolLinks: [] });
    expect(res.headers.get('set-cookie')).toContain(`token=${novo}`);
  });

  it('se o backend diz que a sessão acabou, limpa o cookie e responde 401', async () => {
    cookieGet.mockReturnValue({ value: await token({ id: 7 }) });
    apiPost.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });

    const res = await GET(req('?refresh=1'));

    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toMatch(/^token=;/);
  });

  it('se o backend está fora do ar, segue com o token atual', async () => {
    cookieGet.mockReturnValue({ value: await token({ id: 7, name: 'Ana' }) });
    apiPost.mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await GET(req('?refresh=1'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ name: 'Ana' });
  });

  it('token adulterado responde 401 e limpa o cookie', async () => {
    cookieGet.mockReturnValue({ value: 'a.b.c' });

    const res = await GET(req());

    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toMatch(/^token=;/);
  });
});
