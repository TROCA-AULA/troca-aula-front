import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { masterService } from '@/services/master.service';

vi.mock('@/services/master.service', () => ({
  masterService: {
    getDashboardStats: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useMasterDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega as estatísticas do dashboard', async () => {
    const stats = {
      totalSchools: 3,
      totalClassesAvailable: 5,
      totalSubstitutionsThisMonth: 12,
    };
    vi.mocked(masterService.getDashboardStats).mockResolvedValue(stats);

    const { result } = renderHook(() => useMasterDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual(stats);
    expect(result.current.error).toBeNull();
  });

  it('expõe erro quando a busca falha', async () => {
    vi.mocked(masterService.getDashboardStats).mockRejectedValue(
      new Error('indisponível'),
    );

    const { result } = renderHook(() => useMasterDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('indisponível');
  });
});
