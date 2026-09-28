import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import api from '@/api.service';
import { GET, POST, PATCH, PUT, DELETE } from './route';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/api.service', () => ({
  default: {
    request: vi.fn(),
  },
}));

const params = (...path: string[]) => Promise.resolve({ path });

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(
    new URL(url, 'http://localhost'),
    init as unknown as ConstructorParameters<typeof NextRequest>[1],
  );
}

function mockToken(value: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn(() => (value === undefined ? undefined : { value })),
  } as any);
}

describe('GET/POST/PATCH/PUT/DELETE /api/proxy/[...path]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockToken('token-secreto');
    (api.request as any).mockResolvedValue({ data: { ok: true }, status: 200 });
  });

  it('GET encaminha o caminho e a query string com o token do cookie', async () => {
    const req = makeRequest('http://localhost/api/proxy/schools?page=1&size=10');

    const res = await GET(req, { params: params('schools') });

    expect(api.request).toHaveBeenCalledWith({
      url: '/schools?page=1&size=10',
      method: 'GET',
      data: undefined,
      headers: { Authorization: 'Bearer token-secreto' },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it('GET sem token não envia o header Authorization', async () => {
    mockToken(undefined);
    const req = makeRequest('http://localhost/api/proxy/users');

    await GET(req, { params: params('users') });

    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ headers: {} }),
    );
  });

  it('POST lê o corpo JSON e encaminha como data', async () => {
    const req = makeRequest('http://localhost/api/proxy/schools', {
      method: 'POST',
      body: JSON.stringify({ name: 'Escola Nova' }),
    });

    await POST(req, { params: params('schools') });

    expect(api.request).toHaveBeenCalledWith({
      url: '/schools',
      method: 'POST',
      data: { name: 'Escola Nova' },
      headers: { Authorization: 'Bearer token-secreto' },
    });
  });

  it('POST sem corpo envia data indefinido', async () => {
    const req = makeRequest('http://localhost/api/proxy/schools', { method: 'POST' });

    await POST(req, { params: params('schools') });

    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', data: undefined }),
    );
  });

  it('PATCH, PUT e DELETE encaminham o método e o corpo', async () => {
    const casos = [
      ['PATCH', PATCH],
      ['PUT', PUT],
      ['DELETE', DELETE],
    ] as const;

    for (const [method, handler] of casos) {
      const req = makeRequest(`http://localhost/api/proxy/schools/1`, {
        method,
        body: JSON.stringify({ name: 'Atualizada' }),
      });

      const res = await handler(req, { params: params('schools', '1') });

      expect(api.request).toHaveBeenLastCalledWith({
        url: '/schools/1',
        method,
        data: { name: 'Atualizada' },
        headers: { Authorization: 'Bearer token-secreto' },
      });
      expect(res.status).toBe(200);
    }
  });

  it('repassa status e corpo de um erro do axios (ex.: 401 do backend)', async () => {
    (api.request as any).mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Não autorizado' } },
    });
    const req = makeRequest('http://localhost/api/proxy/users');

    const res = await GET(req, { params: params('users') });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ message: 'Não autorizado' });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('devolve 502 quando o erro do axios não tem response', async () => {
    (api.request as any).mockRejectedValue({ isAxiosError: true });
    const req = makeRequest('http://localhost/api/proxy/users');

    const res = await GET(req, { params: params('users') });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'Erro ao comunicar com o backend.' });
    expect(console.error).toHaveBeenCalled();
  });

  it('devolve 502 para erros que não são do axios', async () => {
    (api.request as any).mockRejectedValue(new Error('queda de rede'));
    const req = makeRequest('http://localhost/api/proxy/users');

    const res = await GET(req, { params: params('users') });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'Erro ao comunicar com o backend.' });
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });
});
