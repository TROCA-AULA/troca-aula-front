import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkloadPolicies } from '@/hooks/useWorkloadPolicies';
import { masterService } from '@/services/master.service';
import { toast } from 'react-toastify';

vi.mock('@/services/master.service', () => ({
  masterService: {
    getWorkloadPolicies: vi.fn(),
    createWorkloadPolicy: vi.fn(),
    updateWorkloadPolicy: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPolicies = [
  {
    id: 1,
    networkId: 1,
    workloadTypeId: 4,
    maxHoursPerWeek: 10,
    ataOficialRequired: true,
    createdAt: '2026-01-01',
  },
];

describe('useWorkloadPolicies Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load policies filtered by networkId', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);

    const { result } = renderHook(() => useWorkloadPolicies(1));

    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));
    expect(masterService.getWorkloadPolicies).toHaveBeenCalledWith(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load all policies when no networkId is given', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);

    renderHook(() => useWorkloadPolicies());

    await waitFor(() =>
      expect(masterService.getWorkloadPolicies).toHaveBeenCalledWith(undefined),
    );
  });

  it('should create a new policy', async () => {
    const newPolicy = { networkId: 1, workloadTypeId: 4, maxHoursPerWeek: 10, ataOficialRequired: true };
    const created = {
      id: 2,
      ...newPolicy,
      createdAt: '2026-01-04',
    };
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.createWorkloadPolicy).mockResolvedValue(created);

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await result.current.createPolicy(newPolicy);
    });

    expect(masterService.createWorkloadPolicy).toHaveBeenCalledWith(newPolicy);
    expect(result.current.policies).toEqual([...mockPolicies, created]);
    expect(toast.success).toHaveBeenCalledWith('Política criada com sucesso');
  });

  it('cria política sem networkId fixo e mantém na lista', async () => {
    const created = {
      id: 3,
      networkId: 2,
      workloadTypeId: 5,
      maxHoursPerWeek: null,
      ataOficialRequired: false,
      createdAt: '2026-01-05',
    };
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.createWorkloadPolicy).mockResolvedValue(created);

    const { result } = renderHook(() => useWorkloadPolicies());
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await result.current.createPolicy({
        networkId: 2,
        workloadTypeId: 5,
      });
    });

    expect(result.current.policies).toEqual([...mockPolicies, created]);
  });

  it('não adiciona à lista quando a política criada é de outra rede', async () => {
    const created = {
      id: 4,
      networkId: 2,
      workloadTypeId: 4,
      maxHoursPerWeek: 20,
      ataOficialRequired: false,
      createdAt: '2026-01-06',
    };
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.createWorkloadPolicy).mockResolvedValue(created);

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await result.current.createPolicy({ networkId: 2, workloadTypeId: 4 });
    });

    expect(masterService.createWorkloadPolicy).toHaveBeenCalled();
    expect(result.current.policies).toEqual(mockPolicies);
    expect(toast.success).toHaveBeenCalledWith('Política criada com sucesso');
  });

  it('propaga erro e mostra toast ao criar política', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.createWorkloadPolicy).mockRejectedValue(
      new Error('política duplicada'),
    );

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await expect(
        result.current.createPolicy({ networkId: 1, workloadTypeId: 4 }),
      ).rejects.toThrow('política duplicada');
    });

    expect(toast.error).toHaveBeenCalledWith('política duplicada');
    expect(result.current.policies).toEqual(mockPolicies);
  });

  it('usa mensagem padrão quando criar política falha sem Error', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.createWorkloadPolicy).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await expect(
        result.current.createPolicy({ networkId: 1, workloadTypeId: 4 }),
      ).rejects.toBe('falhou');
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao criar política');
  });

  it('should update an existing policy', async () => {
    const updateData = { maxHoursPerWeek: 15 };
    const updated = {
      ...mockPolicies[0],
      ...updateData,
    };
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.updateWorkloadPolicy).mockResolvedValue(updated);

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await result.current.updatePolicy(1, updateData);
    });

    expect(masterService.updateWorkloadPolicy).toHaveBeenCalledWith(1, updateData);
    expect(result.current.policies).toEqual([updated]);
    expect(toast.success).toHaveBeenCalledWith('Política atualizada com sucesso');
  });

  it('não altera outras políticas quando atualiza uma que não está na lista', async () => {
    const updatedForOtherId = {
      id: 99,
      networkId: 1,
      workloadTypeId: 4,
      maxHoursPerWeek: 30,
      ataOficialRequired: true,
      createdAt: '2026-01-07',
    };
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.updateWorkloadPolicy).mockResolvedValue(updatedForOtherId);

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await result.current.updatePolicy(99, { maxHoursPerWeek: 30 });
    });

    expect(result.current.policies).toEqual(mockPolicies);
    expect(toast.success).toHaveBeenCalledWith('Política atualizada com sucesso');
  });

  it('propaga erro e mostra toast ao atualizar política', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.updateWorkloadPolicy).mockRejectedValue(
      new Error('sem permissão'),
    );

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await expect(
        result.current.updatePolicy(1, { maxHoursPerWeek: 15 }),
      ).rejects.toThrow('sem permissão');
    });

    expect(toast.error).toHaveBeenCalledWith('sem permissão');
    expect(result.current.policies).toEqual(mockPolicies);
  });

  it('usa mensagem padrão quando atualizar política falha sem Error', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(masterService.updateWorkloadPolicy).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await expect(
        result.current.updatePolicy(1, { maxHoursPerWeek: 15 }),
      ).rejects.toBe('falhou');
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar política');
  });

  it('should handle error state', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useWorkloadPolicies());

    await waitFor(() => expect(result.current.error).toBe('API Error'));
    expect(result.current.loading).toBe(false);
    expect(result.current.policies).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith('API Error');
  });

  it('usa mensagem padrão quando a busca falha sem Error', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useWorkloadPolicies());

    await waitFor(() =>
      expect(result.current.error).toBe('Erro ao carregar políticas'),
    );
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar políticas');
  });

  it('fica em loading enquanto a busca não resolve', () => {
    vi.mocked(masterService.getWorkloadPolicies).mockImplementation(
      () => new Promise(() => {}),
    );

    const { result } = renderHook(() => useWorkloadPolicies(1));

    expect(result.current.loading).toBe(true);
  });

  it('refaz a busca ao chamar refetch', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockResolvedValue(mockPolicies);

    const { result } = renderHook(() => useWorkloadPolicies(1));
    await waitFor(() => expect(result.current.policies).toEqual(mockPolicies));

    await act(async () => {
      await result.current.refetch();
    });

    expect(masterService.getWorkloadPolicies).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
  });
});
