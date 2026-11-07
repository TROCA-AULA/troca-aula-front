import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMaster } from '@/hooks/useMaster';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

function mockUser(profileId: number | null, isLoading = false) {
  vi.mocked(useSchoolContext).mockReturnValue({
    user:
      profileId === null
        ? null
        : { id: 1, name: 'User', email: 'u@e.com', profileId },
    isLoading,
    logout: vi.fn(),
    refreshUserData: vi.fn(),
    schoolLinks: [],
    activeSchoolId: null,
    activeProfileId: profileId,
    activeNetworkId: null,
    setActiveSchoolId: vi.fn(),
  } as any);
}

describe('useMaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('libera acesso para MASTER', () => {
    mockUser(PROFILE.MASTER);

    const { result } = renderHook(() => useMaster());

    expect(result.current.isMaster).toBe(true);
    expect(result.current.checkAccess()).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });

  it('redireciona DIRETOR para o dashboard (não é master)', () => {
    mockUser(PROFILE.DIRETOR);

    const { result } = renderHook(() => useMaster());

    act(() => {
      expect(result.current.checkAccess()).toBe(false);
    });
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('redireciona usuário sem sessão para o login', () => {
    mockUser(null);

    const { result } = renderHook(() => useMaster());

    act(() => {
      expect(result.current.checkAccess()).toBe(false);
    });
    expect(push).toHaveBeenCalledWith('/');
  });

  it('não redireciona enquanto a sessão ainda está carregando', () => {
    mockUser(null, true);

    const { result } = renderHook(() => useMaster());

    expect(result.current.checkAccess()).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });
});
