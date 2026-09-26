import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsers } from '@/hooks/useUsers';
import { masterService } from '@/services/master.service';
import { PROFILE } from '@/constants/profile';

// Correção: este teste antes usava profileId=2 para "Diretor" e profileId=3
// para "Administrador" (mapeamento próprio do módulo master que não batia
// com o backend real). O valor real é DIRETOR=1, AUXILIAR_ADMIN=2 — ver
// src/constants/profile.ts.
vi.mock('@/services/master.service', () => ({
  masterService: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    unlinkUser: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUsers = [
  { id: 1, name: 'Diretor A', email: 'diretor@a.com', phone: '1199999', schoolId: 1, profileId: PROFILE.DIRETOR, createdAt: '2026-01-01' },
  { id: 2, name: 'Diretor B', email: 'diretor@b.com', phone: '1188888', schoolId: 2, profileId: PROFILE.DIRETOR, createdAt: '2026-01-02' },
];

describe('useUsers Hook - US3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load directors (profileId=DIRETOR) on mount', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));

    await waitFor(() => expect(result.current.users).toEqual(mockUsers));
    expect(masterService.getUsers).toHaveBeenCalledWith(PROFILE.DIRETOR, undefined);
  });

  it('should load administrators (profileId=AUXILIAR_ADMIN) on mount', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue([]);

    const { result } = renderHook(() => useUsers(PROFILE.AUXILIAR_ADMIN));

    await waitFor(() => expect(result.current.users).toEqual([]));
    expect(masterService.getUsers).toHaveBeenCalledWith(PROFILE.AUXILIAR_ADMIN, undefined);
  });

  it('should create a new director', async () => {
    const newUser = { name: 'Novo Diretor', email: 'novo@diretor.com', schoolId: 1, profileId: PROFILE.DIRETOR };
    vi.mocked(masterService.createUser).mockResolvedValue({
      id: 3,
      ...newUser,
      phone: null,
      createdAt: '2026-01-03',
      // Fluxo real: POST /users + assign-profile em dois passos, senha
      // temporária gerada no cliente (ver P15 em problemas-conhecidos.md).
      tempPassword: 'tempPass123',
    });

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));

    await act(async () => {
      await result.current.createUser(newUser);
    });

    expect(masterService.createUser).toHaveBeenCalledWith(newUser);
  });

  it('should unlink a director from school', async () => {
    vi.mocked(masterService.unlinkUser).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));

    await act(async () => {
      await result.current.unlinkUser(1, PROFILE.DIRETOR, 1);
    });

    expect(masterService.unlinkUser).toHaveBeenCalledWith(1, PROFILE.DIRETOR, 1);
  });

  it('should handle loading state', () => {
    vi.mocked(masterService.getUsers).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));

    expect(result.current.loading).toBe(true);
  });
});
