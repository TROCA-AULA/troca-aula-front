import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { masterService } from '@/services/master.service';

vi.mock('@/services/master.service', () => ({
  masterService: {
    getAuditLogByNetwork: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockEntries = [
  {
    id: 1,
    networkId: 1,
    entityType: 'TeacherWorkloadRecords',
    entityId: 5,
    changedById: 2,
    changedByName: 'Diretora Ana',
    changedByEmail: 'diretora@escola.com',
    before: null,
    after: { hours: 6 },
    justification: null,
    changedAt: '2026-10-01T10:00:00Z',
  },
];

describe('useAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when networkId is undefined', () => {
    renderHook(() => useAuditLog(undefined));
    expect(masterService.getAuditLogByNetwork).not.toHaveBeenCalled();
  });

  it('loads entries for the given network', async () => {
    vi.mocked(masterService.getAuditLogByNetwork).mockResolvedValue(mockEntries);

    const { result } = renderHook(() => useAuditLog(1));

    await waitFor(() => expect(result.current.entries).toEqual(mockEntries));
    expect(masterService.getAuditLogByNetwork).toHaveBeenCalledWith(1);
  });

  it('sets an error message when the request fails', async () => {
    vi.mocked(masterService.getAuditLogByNetwork).mockRejectedValue(new Error('Falha na rede'));

    const { result } = renderHook(() => useAuditLog(1));

    await waitFor(() => expect(result.current.error).toBe('Falha na rede'));
    expect(result.current.loading).toBe(false);
  });

  it('clears entries when networkId becomes undefined', async () => {
    vi.mocked(masterService.getAuditLogByNetwork).mockResolvedValue(mockEntries);

    const { result, rerender } = renderHook(({ networkId }) => useAuditLog(networkId), {
      initialProps: { networkId: 1 as number | undefined },
    });

    await waitFor(() => expect(result.current.entries).toEqual(mockEntries));

    rerender({ networkId: undefined });

    await waitFor(() => expect(result.current.entries).toEqual([]));
  });
});
