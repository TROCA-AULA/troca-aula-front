import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNetworks } from '@/hooks/useNetworks';
import { masterService } from '@/services/master.service';

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
  });

  it('should create a new network', async () => {
    const newNetwork = { name: 'Rede C' };
    vi.mocked(masterService.createNetwork).mockResolvedValue({
      id: 3,
      ...newNetwork,
      createdAt: '2026-01-03',
    });

    const { result } = renderHook(() => useNetworks());

    await act(async () => {
      await result.current.createNetwork(newNetwork);
    });

    expect(masterService.createNetwork).toHaveBeenCalledWith(newNetwork);
  });

  it('should update an existing network', async () => {
    const updateData = { name: 'Rede A Atualizada' };
    vi.mocked(masterService.updateNetwork).mockResolvedValue({
      id: 1,
      ...updateData,
      createdAt: '2026-01-01',
    });

    const { result } = renderHook(() => useNetworks());

    await act(async () => {
      await result.current.updateNetwork(1, updateData);
    });

    expect(masterService.updateNetwork).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle error state', async () => {
    vi.mocked(masterService.getNetworks).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useNetworks());

    await waitFor(() => expect(result.current.error).toBe('API Error'));
  });
});
