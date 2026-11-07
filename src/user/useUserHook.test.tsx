import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserHook } from './useUserHook';
import { useSchoolContext } from '@/contexts/SchoolContext';

vi.mock('@/contexts/SchoolContext', () => ({
    useSchoolContext: vi.fn(),
}));

// A partir da Fase 3 o SchoolContext é a fonte única de sessão; o
// useUserHook virou um wrapper de compatibilidade (mesma assinatura
// UserContextType). O comportamento em si (buscar /api/auth/me, logout)
// é testado no SchoolContext.test.tsx — aqui só garantimos a delegação.
describe('useUserHook (wrapper do SchoolContext)', () => {
    const logout = vi.fn();
    const refreshUserData = vi.fn();
    const user = { id: 1, name: 'Test User', email: 't@t.com' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useSchoolContext).mockReturnValue({
            user,
            isLoading: false,
            logout,
            refreshUserData,
            schoolLinks: [],
            activeSchoolId: null,
            activeProfileId: null,
            activeNetworkId: null,
            setActiveSchoolId: vi.fn(),
        } as any);
    });

    it('delega para o SchoolContext (fonte única de sessão)', () => {
        const { result } = renderHook(() => useUserHook());

        expect(result.current.user).toEqual(user);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.logout).toBe(logout);
        expect(result.current.refreshUserData).toBe(refreshUserData);
    });
});
