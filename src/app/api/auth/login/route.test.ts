import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { AxiosError } from 'axios';
import api from '@/api.service';
import { POST } from './route';

vi.mock('@/api.service', () => ({ default: { post: vi.fn() } }));

function loginRequest() {
  return new NextRequest(new URL('http://localhost/api/auth/login'), {
    method: 'POST',
    body: JSON.stringify({ email: 'ana@escola.br', password: 'segredo-da-ana' }),
  });
}

function backendError(status?: number) {
  const config = { method: 'post', url: '/auth/login', data: '{"password":"segredo-da-ana"}' };
  const response = status ? { status, statusText: '', data: {}, headers: {}, config } : undefined;
  return new AxiosError('falhou', status ? undefined : 'ECONNREFUSED', config as any, undefined, response as any);
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('login certo grava o cookie de sessão', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { access_token: 'tok' } } as any);

    const res = await POST(loginRequest());

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'ana@escola.br', password: 'segredo-da-ana' });
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toContain('token=tok');
  });

  it('senha errada responde 401 sem registrar a senha no log', async () => {
    vi.mocked(api.post).mockRejectedValue(backendError(401));

    const res = await POST(loginRequest());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Credenciais inválidas' });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('segredo-da-ana');
  });

  it('backend fora do ar responde 503 e registra uma linha curta, sem a senha', async () => {
    vi.mocked(api.post).mockRejectedValue(backendError());

    const res = await POST(loginRequest());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: 'Serviço indisponível' });
    expect(console.error).toHaveBeenCalledWith('[auth/login]', 'POST /auth/login → ECONNREFUSED');
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('segredo-da-ana');
  });

  it('erro interno do backend (500) também é indisponibilidade', async () => {
    vi.mocked(api.post).mockRejectedValue(backendError(500));

    const res = await POST(loginRequest());

    expect(res.status).toBe(503);
  });
});
