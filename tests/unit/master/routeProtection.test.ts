import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMaster } from '@/hooks/useMaster';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';

// Correção: este teste antes codificava o mapeamento ERRADO de profileId
// (assumia 1=Master, 2=Diretor, 3=Admin, 4=Professor) como comportamento
// esperado — o mesmo bug de autorização real encontrado na auditoria
// (ver docs/design-doc-evolucao-multi-tenant.md). O valor real do backend
// é DIRETOR=1, AUXILIAR_ADMIN=2, PROFESSOR=3, MASTER=4
// (src/modules/profile/profile.enum.ts no troca-aula-backend).
vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe('Route Protection - US1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLogout = vi.fn();
  const mockRefreshUserData = vi.fn();

  it('should allow access when user profileId is 4 (Master)', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 1, email: 'master@test.com', profileId: PROFILE.MASTER, name: 'Master User' },
      isLoading: false,
      logout: mockLogout,
      refreshUserData: mockRefreshUserData,
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: PROFILE.MASTER,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    });

    const { result } = renderHook(() => useMaster());

    expect(result.current.isMaster).toBe(true);
  });

  it('should block access when user profileId is 1 (Diretor)', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 2, email: 'diretor@test.com', profileId: PROFILE.DIRETOR, name: 'Diretor' },
      isLoading: false,
      logout: mockLogout,
      refreshUserData: mockRefreshUserData,
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: PROFILE.DIRETOR,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    });

    const { result } = renderHook(() => useMaster());

    expect(result.current.isMaster).toBe(false);
  });

  it('should block access when user profileId is 2 (Auxiliar Administrativo)', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 3, email: 'admin@test.com', profileId: PROFILE.AUXILIAR_ADMIN, name: 'Admin' },
      isLoading: false,
      logout: mockLogout,
      refreshUserData: mockRefreshUserData,
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: PROFILE.AUXILIAR_ADMIN,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    });

    const { result } = renderHook(() => useMaster());

    expect(result.current.isMaster).toBe(false);
  });

  it('should block access when user profileId is 3 (Professor)', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 4, email: 'professor@test.com', profileId: PROFILE.PROFESSOR, name: 'Professor' },
      isLoading: false,
      logout: mockLogout,
      refreshUserData: mockRefreshUserData,
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: PROFILE.PROFESSOR,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    });

    const { result } = renderHook(() => useMaster());

    expect(result.current.isMaster).toBe(false);
  });

  it('should block access when user is null', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: null,
      isLoading: false,
      logout: mockLogout,
      refreshUserData: mockRefreshUserData,
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: null,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    });

    const { result } = renderHook(() => useMaster());

    expect(result.current.isMaster).toBe(false);
  });

  it('should return loading state when checking access', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: null,
      isLoading: true,
      logout: mockLogout,
      refreshUserData: mockRefreshUserData,
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: null,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    });

    const { result } = renderHook(() => useMaster());

    expect(result.current.isLoading).toBe(true);
  });
});
