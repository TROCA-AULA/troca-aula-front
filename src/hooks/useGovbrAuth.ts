'use client';

import { useState, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { UserDTO } from '@/types/auth';

interface UseGovbrAuthReturn {
  isLoading: boolean;
  error: string | null;
  loginWithGovbr: (code: string) => Promise<{ user: UserDTO; token: string } | null>;
  logout: () => void;
}

export function useGovbrAuth(): UseGovbrAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGovbr = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const redirectUri = `${window.location.origin}/auth/govbr-callback`;
      const response = await authService.loginWithGovbr(code, redirectUri);

      // Grava o JWT como cookie httpOnly (mesmo mecanismo do login
      // tradicional), em vez de localStorage — corrige o achado P2:
      // antes, o middleware não reconhecia a sessão Gov.br.
      const sessionRes = await fetch('/api/auth/govbr-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: response.token }),
      });

      if (!sessionRes.ok) {
        throw new Error('Não foi possível iniciar a sessão.');
      }

      return { user: response.user, token: response.token };
    } catch (err: unknown) {
      const message = err instanceof Error 
        ? err.message 
        : 'Falha na autenticação Gov.br. Tente novamente ou use login tradicional.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Mesma rota usada pelo logout do login tradicional (useUserHook) —
    // a sessão agora vive só no cookie httpOnly, não há mais localStorage
    // de auth para limpar.
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
      // Reload completo de propósito após o logout (limpa qualquer estado
      // em memória da SPA) — por isso não é router.push.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/';
    });
  }, []);

  return { isLoading, error, loginWithGovbr, logout };
}

export default useGovbrAuth;