import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

  describe('sessão expirada (D19)', () => {
    const originalLocation = window.location;
    const assign = vi.fn();

    function setPath(pathname: string) {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname, assign },
      });
    }

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('401 sem explicação leva para o login uma única vez', () => {
      setPath('/dashboard');
      const erro = { response: { status: 401, data: { message: 'Unauthorized' } } };

      for (let i = 0; i < 2; i++) {
        try {
          onError(erro);
        } catch (e) {
          expect(e).toBe(erro);
        }
      }

      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith('/');
      expect(toastError).toHaveBeenCalledTimes(1);
      expect(toastError).toHaveBeenCalledWith('Sua sessão expirou. Entre de novo.');
    });

    it('na própria tela de login, ou com mensagem de negócio, não redireciona', () => {
      setPath('/');
      try {
        onError({ response: { status: 401, data: {} } });
      } catch {
        // relança
      }
      setPath('/alterar-senha');
      try {
        onError({ response: { status: 401, data: { message: 'Senha atual incorreta' } } });
      } catch {
        // relança
      }

      expect(assign).not.toHaveBeenCalled();
      expect(toastError).toHaveBeenLastCalledWith('Senha atual incorreta');
    });
  });
});
