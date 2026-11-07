import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubstitutionLimit } from '@/hooks/useSubstitutionLimit';
import api from '@/api-client.service';

vi.mock('@/api-client.service', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('useSubstitutionLimit Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the loading state before the request resolves', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSubstitutionLimit(2));

    expect(result.current.loading).toBe(true);
  });

  it('should fetch the status from the server-computed endpoint (P14: no client-side date math)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { current: 1, limit: 4, percentage: 25, canApply: true },
    });

    const { result } = renderHook(() => useSubstitutionLimit(2));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.get).toHaveBeenCalledWith('/enrollment-requests/substitution-limit/2');
    expect(result.current).toEqual({
      current: 1,
      limit: 4,
      percentage: 25,
      canApply: true,
      loading: false,
      error: null,
    });
  });

  it('should not fetch when no userId is given', () => {
    const { result } = renderHook(() => useSubstitutionLimit(undefined));

    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('should surface an error when the request fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Falha na rede'));

    const { result } = renderHook(() => useSubstitutionLimit(2));

    await waitFor(() => expect(result.current.error).toBe('Falha na rede'));
    expect(result.current.loading).toBe(false);
  });
});
