import { describe, it, expect, vi, beforeEach } from 'vitest';

// Este arquivo cria a instância axios já no import, então o próprio 'axios' é
// mockado para capturar os interceptors registrados.
const { axiosCreate, responseUse, toastError } = vi.hoisted(() => {
  const responseUse = vi.fn();
  return {
    responseUse,
    toastError: vi.fn(),
    axiosCreate: vi.fn(() => ({
      interceptors: { response: { use: responseUse } },
    })),
  };
});

vi.mock('axios', () => ({ default: { create: axiosCreate } }));
vi.mock('react-toastify', () => ({ toast: { error: toastError } }));

import axios from 'axios';
import apiClient from '@/api-client.service';

// Capturados no import, antes de qualquer clearAllMocks.
const createConfig = (
  axiosCreate.mock.calls as unknown as Array<[unknown]>
)[0]?.[0];
const [onSuccess, onError] = (
  responseUse.mock.calls as unknown as Array<
    [(response: unknown) => unknown, (error: unknown) => never]
  >
)[0];

describe('api-client.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria a instância axios apontando para o proxy same-origin', () => {
    expect(createConfig).toEqual({ baseURL: '/api/proxy' });
    expect(axios.create).toBe(axiosCreate);
    expect(apiClient).toBeDefined();
  });

  it('deixa a resposta de sucesso passar intacta', () => {
    const resposta = { data: { ok: true } };

    expect(onSuccess(resposta)).toBe(resposta);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('junta as mensagens em array, uma por linha, e relança o erro original', () => {
    const erro = {
      response: { data: { message: ['Campo obrigatório', 'E-mail inválido'] } },
    };

    let lancado: unknown;
    try {
      onError(erro);
    } catch (e) {
      lancado = e;
    }

    expect(lancado).toBe(erro);
    expect(toastError).toHaveBeenCalledWith('Campo obrigatório\nE-mail inválido');
  });

  it('mostra a mensagem quando ela é uma string', () => {
    const erro = { response: { data: { message: 'Sessão expirada' } } };

    let lancado: unknown;
    try {
      onError(erro);
    } catch (e) {
      lancado = e;
    }

    expect(lancado).toBe(erro);
    expect(toastError).toHaveBeenCalledWith('Sessão expirada');
  });

  it('mostra mensagem genérica quando o erro não traz mensagem utilizável', () => {
    const erros = [
      null,
      {},
      { response: { data: {} } },
      { response: { data: { message: 42 } } },
      { response: undefined },
    ];

    for (const erro of erros) {
      try {
        onError(erro);
      } catch {
        // o interceptor sempre relança o erro original
      }
    }

    expect(toastError).toHaveBeenCalledTimes(erros.length);
    for (let i = 0; i < erros.length; i++) {
      expect(toastError).toHaveBeenNthCalledWith(i + 1, 'Erro inesperado na requisicao');
    }
  });
});
