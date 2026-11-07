import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNetworks } from '@/hooks/useNetworks';
import { masterService } from '@/services/master.service';
import { toast } from 'react-toastify';

vi.mock('@/services/master.service', () => ({
  masterService: {
    getNetworks: vi.fn(),
    createNetwork: vi.fn(),
    updateNetwork: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNetworks = [
  { id: 1, name: 'Rede A', createdAt: '2026-01-01' },
  { id: 2, name: 'Rede B', createdAt: '2026-01-02' },
];

describe('useNetworks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load networks on mount', async () => {
    vi.mocked(masterService.getNetworks).mockResolvedValue(mockNetworks);

    const { result } = renderHook(() => useNetworks());

    await waitFor(() => expect(result.current.networks).toEqual(mockNetworks));
    expect(masterService.getNetworks).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should create a new network', async () => {
    const newNetwork = { name: 'Rede C' };
    vi.mocked(masterService.getNetworks).mockResolvedValue(mockNetworks);
    vi.mocked(masterService.createNetwork).mockResolvedValue({
      id: 3,
      ...newNetwork,
      createdAt: '2026-01-03',
    });

    const { result } = renderHook(() => useNetworks());
    await waitFor(() => expect(result.current.networks).toEqual(mockNetworks));

    await act(async () => {
      await result.current.createNetwork(newNetwork);
    });

    expect(masterService.createNetwork).toHaveBeenCalledWith(newNetwork);
    expect(result.current.networks).toEqual([
      ...mockNetworks,
      { id: 3, name: 'Rede C', createdAt: '2026-01-03' },
    ]);
    expect(toast.success).toHaveBeenCalledWith('Rede criada com sucesso');
  });

  it('should update an existing network', async () => {
    const updateData = { name: 'Rede A Atualizada' };
    vi.mocked(masterService.getNetworks).mockResolvedValue(mockNetworks);
    vi.mocked(masterService.updateNetwork).mockResolvedValue({
      id: 1,
      ...updateData,
      createdAt: '2026-01-01',
    });

    const { result } = renderHook(() => useNetworks());
    await waitFor(() => expect(result.current.networks).toEqual(mockNetworks));

    await act(async () => {
      await result.current.updateNetwork(1, updateData);
    });

    expect(masterService.updateNetwork).toHaveBeenCalledWith(1, updateData);
    expect(result.current.networks).toEqual([
      { id: 1, name: 'Rede A Atualizada', createdAt: '2026-01-01' },
      mockNetworks[1],
    ]);
    expect(toast.success).toHaveBeenCalledWith('Rede atualizada com sucesso');
  });

  it('should handle error state', async () => {
    vi.mocked(masterService.getNetworks).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useNetworks());

    await waitFor(() => expect(result.current.error).toBe('API Error'));
    expect(result.current.loading).toBe(false);
    expect(result.current.networks).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith('API Error');
  });

  it('usa mensagem padrão quando a busca falha sem Error', async () => {
    vi.mocked(masterService.getNetworks).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useNetworks());

    await waitFor(() => expect(result.current.error).toBe('Erro ao carregar redes'));
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar redes');
  });

  it('propaga erro e mostra toast ao criar rede', async () => {
    vi.mocked(masterService.getNetworks).mockResolvedValue(mockNetworks);
    vi.mocked(masterService.createNetwork).mockRejectedValue(
      new Error('nome duplicado'),
    );

    const { result } = renderHook(() => useNetworks());
    await waitFor(() => expect(result.current.networks).toEqual(mockNetworks));

    await act(async () => {
      await expect(
        result.current.createNetwork({ name: 'Rede A' }),
      ).rejects.toThrow('nome duplicado');
    });

    expect(toast.error).toHaveBeenCalledWith('nome duplicado');
    expect(result.current.networks).toEqual(mockNetworks);
  });

  it('usa mensagem padrão quando criar rede falha sem Error', async () => {
    vi.mocked(masterService.getNetworks).mockResolvedValue(mockNetworks);
    vi.mocked(masterService.createNetwork).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useNetworks());
    await waitFor(() => expect(result.current.networks).toEqual(mockNetworks));

    await act(async () => {
      await expect(
        result.current.createNetwork({ name: 'Rede C' }),
      ).rejects.toBe('falhou');
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao criar rede');
  });

  it('propaga erro e mostra toast ao atualizar rede', async () => {
    vi.mocked(masterService.getNetworks).mockResolvedValue(mockNetworks);
    vi.mocked(masterService.updateNetwork).mockRejectedValue(
      new Error('sem permissão'),
    );

    const { result } = renderHook(() => useNetworks());
    await waitFor(() => expect(result.current.networks).toEqual(mockNetworks));

    await act(async () => {
      await expect(result.current.updateNetwork(1, { name: 'X' })).rejects.toThrow(
        'sem permissão',
      );
    });

    expect(toast.error).toHaveBeenCalledWith('sem permissão');
    expect(result.current.networks).toEqual(mockNetworks);
  });

  it('usa mensagem padrão quando atualizar rede falha sem Error', async () => {
    vi.mocked(masterService.getNetworks).mockResolvedValue(mockNetworks);
    vi.mocked(masterService.updateNetwork).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useNetworks());
    await waitFor(() => expect(result.current.networks).toEqual(mockNetworks));

    await act(async () => {
      await expect(result.current.updateNetwork(1, { name: 'X' })).rejects.toBe(
        'falhou',
      );
    });

    expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar rede');
  });

  it('refaz a busca ao chamar refetch', async () => {
    vi.mocked(masterService.getNetworks).mockResolvedValue(mockNetworks);

    const { result } = renderHook(() => useNetworks());
    await waitFor(() => expect(result.current.networks).toEqual(mockNetworks));

    await act(async () => {
      await result.current.refetch();
    });

    expect(masterService.getNetworks).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
  });
});
