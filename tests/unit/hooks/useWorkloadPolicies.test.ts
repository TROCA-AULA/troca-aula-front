import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkloadPolicies } from '@/hooks/useWorkloadPolicies';
import { masterService } from '@/services/master.service';

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
    vi.mocked(masterService.createWorkloadPolicy).mockResolvedValue({
      id: 2,
      ...newPolicy,
      createdAt: '2026-01-04',
    });

    const { result } = renderHook(() => useWorkloadPolicies(1));

    await act(async () => {
      await result.current.createPolicy(newPolicy);
    });

    expect(masterService.createWorkloadPolicy).toHaveBeenCalledWith(newPolicy);
  });

  it('should update an existing policy', async () => {
    const updateData = { maxHoursPerWeek: 15 };
    vi.mocked(masterService.updateWorkloadPolicy).mockResolvedValue({
      ...mockPolicies[0],
      ...updateData,
    });

    const { result } = renderHook(() => useWorkloadPolicies(1));

    await act(async () => {
      await result.current.updatePolicy(1, updateData);
    });

    expect(masterService.updateWorkloadPolicy).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle error state', async () => {
    vi.mocked(masterService.getWorkloadPolicies).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useWorkloadPolicies());

    await waitFor(() => expect(result.current.error).toBe('API Error'));
  });
});
