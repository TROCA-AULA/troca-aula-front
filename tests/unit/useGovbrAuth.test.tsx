import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGovbrAuth } from '../../src/hooks/useGovbrAuth';

vi.mock('../../src/services/auth.service', () => ({
  authService: {
    loginWithGovbr: vi.fn(),
    getGovbrAuthUrl: vi.fn(),
  },
}));

import { authService } from '../../src/services/auth.service';

describe('useGovbrAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // @ts-expect-error jsdom não implementa navigation de verdade
    delete window.location;
    // @ts-expect-error idem
    window.location = { href: '', origin: 'http://localhost:3000' };
  });

  describe('loginWithGovbr', () => {
    it('grava o token como cookie httpOnly via /api/auth/govbr-session, não em localStorage', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: {
          id: 'user-123',
          name: 'João Silva',
          email: 'joao@test.com',
          cpf: '12345678901',
          roles: ['teacher'],
        },
        expires_in: 3600,
      };

      (authService.loginWithGovbr as any).mockResolvedValue(mockResponse);
      (global.fetch as any).mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useGovbrAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.loginWithGovbr('some-code');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/govbr-session',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ token: 'mock-token' }),
        }),
      );
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(loginResult).toEqual({ user: mockResponse.user, token: 'mock-token' });
    });

    it('retorna null e seta erro se a sessão não puder ser criada', async () => {
      (authService.loginWithGovbr as any).mockResolvedValue({
        token: 'mock-token',
        user: { id: 'user-123' },
      });
      (global.fetch as any).mockResolvedValue({ ok: false });

      const { result } = renderHook(() => useGovbrAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.loginWithGovbr('some-code');
      });

      expect(loginResult).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('chama /api/auth/logout (mesma rota do login tradicional) e redireciona', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useGovbrAuth());

      act(() => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      });
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useGovbrAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
