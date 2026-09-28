import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSchools } from '@/hooks/useSchools';
import { masterService } from '@/services/master.service';
import { toast } from 'react-toastify';

vi.mock('@/services/master.service', () => ({
  masterService: {
    getSchools: vi.fn(),
    createSchool: vi.fn(),
    updateSchool: vi.fn(),
    updateSchoolPriorityWindow: vi.fn(),
    deleteSchool: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSchools = [
  { id: 1, name: 'Escola A', networkId: 1, substitutionLimitPerSemester: 10, priorityWindowHours: null, createdAt: '2026-01-01' },
  { id: 2, name: 'Escola B', networkId: 1, substitutionLimitPerSemester: 5, priorityWindowHours: null, createdAt: '2026-01-02' },
];

describe('useSchools Hook - US2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load schools on mount', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);

    const { result } = renderHook(() => useSchools());

    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));
    expect(masterService.getSchools).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should create a new school', async () => {
    const newSchool = { name: 'Escola C', networkId: 1 };
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.createSchool).mockResolvedValue({
      id: 3,
      ...newSchool,
      substitutionLimitPerSemester: null,
      priorityWindowHours: null,
      createdAt: '2026-01-03',
    });

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await result.current.createSchool(newSchool);
    });

    expect(masterService.createSchool).toHaveBeenCalledWith(newSchool);
    expect(result.current.schools).toEqual([
      ...mockSchools,
      {
        id: 3,
        name: 'Escola C',
        networkId: 1,
        substitutionLimitPerSemester: null,
        priorityWindowHours: null,
        createdAt: '2026-01-03',
      },
    ]);
    expect(toast.success).toHaveBeenCalledWith('Escola criada com sucesso');
  });

  it('should update an existing school', async () => {
    const updateData = { name: 'Escola A Atualizada' };
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.updateSchool).mockResolvedValue({
      id: 1,
      ...updateData,
      networkId: 1,
      substitutionLimitPerSemester: 10,
      priorityWindowHours: null,
      createdAt: '2026-01-01',
    });

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await result.current.updateSchool(1, updateData);
    });

    expect(masterService.updateSchool).toHaveBeenCalledWith(1, updateData);
    expect(result.current.schools).toEqual([
      {
        id: 1,
        name: 'Escola A Atualizada',
        networkId: 1,
        substitutionLimitPerSemester: 10,
        priorityWindowHours: null,
        createdAt: '2026-01-01',
      },
      mockSchools[1],
    ]);
    expect(toast.success).toHaveBeenCalledWith('Escola atualizada com sucesso');
  });

  it('should delete a school', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.deleteSchool).mockResolvedValue();

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await result.current.deleteSchool(1);
    });

    expect(masterService.deleteSchool).toHaveBeenCalledWith(1);
    expect(result.current.schools).toEqual([mockSchools[1]]);
    expect(toast.success).toHaveBeenCalledWith('Escola excluída com sucesso');
  });

  it('should handle loading state', () => {
    vi.mocked(masterService.getSchools).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useSchools());

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', async () => {
    vi.mocked(masterService.getSchools).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useSchools());

    await waitFor(() => expect(result.current.error).toBe('API Error'));
    expect(result.current.loading).toBe(false);
    expect(result.current.schools).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith('API Error');
  });

  it('usa mensagem padrão quando a busca falha sem Error', async () => {
    vi.mocked(masterService.getSchools).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useSchools());

    await waitFor(() =>
      expect(result.current.error).toBe('Erro ao carregar escolas'),
    );
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar escolas');
  });

  it('atualiza a janela de prioridade da escola', async () => {
    const updated = { ...mockSchools[0], priorityWindowHours: 24 };
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.updateSchoolPriorityWindow).mockResolvedValue(updated);

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await result.current.updatePriorityWindow(1, 24);
    });

    expect(masterService.updateSchoolPriorityWindow).toHaveBeenCalledWith(1, 24);
    expect(result.current.schools).toEqual([updated, mockSchools[1]]);
    expect(toast.success).toHaveBeenCalledWith('Regra de prioridade atualizada');
  });

  it('propaga erro e mostra toast ao criar escola', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.createSchool).mockRejectedValue(
      new Error('escola inválida'),
    );

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await expect(
        result.current.createSchool({ name: 'X', networkId: 1 }),
      ).rejects.toThrow('escola inválida');
    });

    expect(toast.error).toHaveBeenCalledWith('escola inválida');
    expect(result.current.schools).toEqual(mockSchools);
  });

  it('usa mensagem padrão quando criar escola falha sem Error', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.createSchool).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await expect(
        result.current.createSchool({ name: 'X', networkId: 1 }),
      ).rejects.toBe('falhou');
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao criar escola');
  });

  it('propaga erro e mostra toast ao atualizar escola', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.updateSchool).mockRejectedValue(
      new Error('sem permissão'),
    );

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await expect(result.current.updateSchool(1, { name: 'X' })).rejects.toThrow(
        'sem permissão',
      );
    });

    expect(toast.error).toHaveBeenCalledWith('sem permissão');
  });

  it('usa mensagem padrão quando atualizar escola falha sem Error', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.updateSchool).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await expect(result.current.updateSchool(1, { name: 'X' })).rejects.toBe(
        'falhou',
      );
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar escola');
  });

  it('propaga erro e mostra toast ao excluir escola', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.deleteSchool).mockRejectedValue(
      new Error('escola em uso'),
    );

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await expect(result.current.deleteSchool(1)).rejects.toThrow(
        'escola em uso',
      );
    });

    expect(toast.error).toHaveBeenCalledWith('escola em uso');
    expect(result.current.schools).toEqual(mockSchools);
  });

  it('usa mensagem padrão quando excluir escola falha sem Error', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.deleteSchool).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await expect(result.current.deleteSchool(1)).rejects.toBe('falhou');
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao excluir escola');
  });

  it('propaga erro ao atualizar a janela de prioridade e usa mensagem padrão sem Error', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);
    vi.mocked(masterService.updateSchoolPriorityWindow).mockRejectedValue(
      new Error('falha na regra'),
    );

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await expect(result.current.updatePriorityWindow(1, 12)).rejects.toThrow(
        'falha na regra',
      );
    });
    expect(toast.error).toHaveBeenCalledWith('falha na regra');

    vi.mocked(masterService.updateSchoolPriorityWindow).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    await act(async () => {
      await expect(result.current.updatePriorityWindow(1, null)).rejects.toBe(
        'falhou',
      );
    });
    expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar regra de prioridade');
  });

  it('refaz a busca ao chamar refetch', async () => {
    vi.mocked(masterService.getSchools).mockResolvedValue(mockSchools);

    const { result } = renderHook(() => useSchools());
    await waitFor(() => expect(result.current.schools).toEqual(mockSchools));

    await act(async () => {
      await result.current.refetch();
    });

    expect(masterService.getSchools).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
  });
});
