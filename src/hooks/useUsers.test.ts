import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsers } from '@/hooks/useUsers';
import { masterService } from '@/services/master.service';
import { PROFILE } from '@/constants/profile';
import { toast } from 'react-toastify';

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

const createdDirector = {
  id: 3,
  name: 'Novo Diretor',
  email: 'novo@diretor.com',
  phone: null,
  schoolId: 1,
  profileId: PROFILE.DIRETOR,
  createdAt: '2026-01-03',
  tempPassword: 'tempPass123',
};

describe('useUsers Hook - US3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load directors (profileId=DIRETOR) on mount', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));

    await waitFor(() => expect(result.current.users).toEqual(mockUsers));
    expect(masterService.getUsers).toHaveBeenCalledWith(PROFILE.DIRETOR, undefined);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load administrators (profileId=AUXILIAR_ADMIN) on mount', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue([]);

    const { result } = renderHook(() =>
      useUsers(PROFILE.AUXILIAR_ADMIN, 6),
    );

    await waitFor(() => expect(result.current.users).toEqual([]));
    expect(masterService.getUsers).toHaveBeenCalledWith(PROFILE.AUXILIAR_ADMIN, 6);
  });

  it('should create a new director', async () => {
    const newUser = { name: 'Novo Diretor', email: 'novo@diretor.com', schoolId: 1, profileId: PROFILE.DIRETOR };
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(masterService.createUser).mockResolvedValue(createdDirector);

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));
    await waitFor(() => expect(result.current.users).toEqual(mockUsers));

    await act(async () => {
      await result.current.createUser(newUser);
    });

    expect(masterService.createUser).toHaveBeenCalledWith(newUser);
    expect(result.current.users).toEqual([...mockUsers, createdDirector]);
    expect(toast.success).toHaveBeenCalledWith(
      'Diretor "Novo Diretor" criado. Senha temporária: tempPass123 (repasse manualmente, essa senha não fica salva em nenhum outro lugar).',
      { autoClose: false },
    );
  });

  it('cria administrador com o rótulo correto no toast', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue([]);
    vi.mocked(masterService.createUser).mockResolvedValue({
      ...createdDirector,
      profileId: PROFILE.AUXILIAR_ADMIN,
    });

    const { result } = renderHook(() => useUsers(PROFILE.AUXILIAR_ADMIN, 6));
    await waitFor(() => expect(result.current.users).toEqual([]));

    await act(async () => {
      await result.current.createUser({
        name: 'Novo Diretor',
        email: 'novo@diretor.com',
        schoolId: 6,
        profileId: PROFILE.AUXILIAR_ADMIN,
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Administrador "Novo Diretor" criado.'),
      { autoClose: false },
    );
  });

  it('propaga erro e mostra toast ao criar usuário', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(masterService.createUser).mockRejectedValue(
      new Error('e-mail já cadastrado'),
    );

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));
    await waitFor(() => expect(result.current.users).toEqual(mockUsers));

    await act(async () => {
      await expect(
        result.current.createUser({
          name: 'X',
          email: 'x@e.com',
          schoolId: 1,
          profileId: PROFILE.DIRETOR,
        }),
      ).rejects.toThrow('e-mail já cadastrado');
    });

    expect(toast.error).toHaveBeenCalledWith('e-mail já cadastrado');
    expect(result.current.users).toEqual(mockUsers);
  });

  it('usa mensagem padrão quando criar usuário falha sem Error', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(masterService.createUser).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));
    await waitFor(() => expect(result.current.users).toEqual(mockUsers));

    await act(async () => {
      await expect(
        result.current.createUser({
          name: 'X',
          email: 'x@e.com',
          schoolId: 1,
          profileId: PROFILE.DIRETOR,
        }),
      ).rejects.toBe('falhou');
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao criar usuário');
  });

  it('should unlink a director from school', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(masterService.unlinkUser).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));
    await waitFor(() => expect(result.current.users).toEqual(mockUsers));

    await act(async () => {
      await result.current.unlinkUser(1, PROFILE.DIRETOR, 1);
    });

    expect(masterService.unlinkUser).toHaveBeenCalledWith(1, PROFILE.DIRETOR, 1);
    expect(result.current.users).toEqual([mockUsers[1]]);
    expect(toast.success).toHaveBeenCalledWith('Vínculo removido com sucesso');
  });

  it('propaga erro e mostra toast ao desvincular usuário', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(masterService.unlinkUser).mockRejectedValue(
      new Error('vínculo inexistente'),
    );

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));
    await waitFor(() => expect(result.current.users).toEqual(mockUsers));

    await act(async () => {
      await expect(
        result.current.unlinkUser(1, PROFILE.DIRETOR, 1),
      ).rejects.toThrow('vínculo inexistente');
    });

    expect(toast.error).toHaveBeenCalledWith('vínculo inexistente');
    expect(result.current.users).toEqual(mockUsers);
  });

  it('usa mensagem padrão quando desvincular falha sem Error', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(masterService.unlinkUser).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));
    await waitFor(() => expect(result.current.users).toEqual(mockUsers));

    await act(async () => {
      await expect(result.current.unlinkUser(1, PROFILE.DIRETOR, 1)).rejects.toBe(
        'falhou',
      );
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao desvincular usuário');
  });

  it('should handle loading state', () => {
    vi.mocked(masterService.getUsers).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', async () => {
    vi.mocked(masterService.getUsers).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));

    await waitFor(() => expect(result.current.error).toBe('API Error'));
    expect(result.current.loading).toBe(false);
    expect(result.current.users).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith('API Error');
  });

  it('usa mensagem padrão quando a busca falha sem Error', async () => {
    vi.mocked(masterService.getUsers).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));

    await waitFor(() =>
      expect(result.current.error).toBe('Erro ao carregar usuários'),
    );
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar usuários');
  });

  it('refaz a busca ao chamar refetch', async () => {
    vi.mocked(masterService.getUsers).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useUsers(PROFILE.DIRETOR));
    await waitFor(() => expect(result.current.users).toEqual(mockUsers));

    await act(async () => {
      await result.current.refetch();
    });

    expect(masterService.getUsers).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
  });
});
