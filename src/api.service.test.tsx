import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api.service';

describe('api service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should pass through success response', async () => {
        const response = { data: 'test' };
        // @ts-ignore
        const result = api.interceptors.response.handlers[0].fulfilled(response);
        expect(result).toBe(response);
    });

    // Regressão: este interceptor roda EXCLUSIVAMENTE server-side (ver
    // comentário em api.service.tsx). Uma versão anterior chamava
    // toast.error() aqui, que lança TypeError fora do navegador e mascarava
    // o AxiosError original (um 401 real virava um 500/502 genérico na
    // resposta da rota). Este teste garante que o erro original propaga
    // intacto, sem depender de nenhuma API de navegador.
    it('should log and rethrow the original error without touching browser APIs', async () => {
        const error = {
            response: {
                status: 401,
                data: {
                    message: ['Error 1', 'Error 2'],
                },
            },
        };

        console.error = vi.fn();

        try {
            // @ts-ignore
            api.interceptors.response.handlers[0].rejected(error);
            expect.unreachable('esperava que o interceptor relançasse o erro');
        } catch (e) {
            expect(e).toBe(error);
        }

        expect(console.error).toHaveBeenCalledWith(
            '[api.service] erro na chamada ao backend:',
            401,
            error.response.data,
        );
    });
});
