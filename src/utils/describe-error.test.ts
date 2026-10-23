import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { describeError } from './describe-error';

function axiosError(status?: number, code?: string) {
  const config = {
    method: 'post',
    url: '/auth/login',
    data: '{"email":"a@b.c","password":"segredo"}',
    headers: new AxiosHeaders({ Authorization: 'Bearer token-secreto' }),
  };
  const response = status
    ? { status, statusText: '', data: {}, headers: {}, config }
    : undefined;
  return new AxiosError('falhou', code, config as any, undefined, response as any);
}

describe('describeError', () => {
  it('erro do backend vira método, caminho e status, sem senha nem token', () => {
    const text = describeError(axiosError(401));
    expect(text).toBe('POST /auth/login → HTTP 401');
    expect(text).not.toContain('segredo');
    expect(text).not.toContain('token-secreto');
  });

  it('backend fora do ar mostra o código da falha de rede', () => {
    expect(describeError(axiosError(undefined, 'ECONNREFUSED'))).toBe('POST /auth/login → ECONNREFUSED');
  });

  it('erro do axios sem config mostra só o motivo', () => {
    expect(describeError(new AxiosError('falhou'))).toBe('falhou');
  });

  it('erro comum mostra a mensagem; outros valores viram texto', () => {
    expect(describeError(new Error('quebrou'))).toBe('quebrou');
    expect(describeError('estranho')).toBe('estranho');
  });
});
