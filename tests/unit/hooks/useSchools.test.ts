import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSchools } from '@/hooks/useSchools';
import { masterService } from '@/services/master.service';

vi.mock('@/services/master.service', () => ({
  masterService: {
    getSchools: vi.fn(),
    createSchool: vi.fn(),
    updateSchool: vi.fn(),
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
  });

  it('should create a new school', async () => {
    const newSchool = { name: 'Escola C', networkId: 1 };
    vi.mocked(masterService.createSchool).mockResolvedValue({
      id: 3,
      ...newSchool,
      substitutionLimitPerSemester: null,
      priorityWindowHours: null,
      createdAt: '2026-01-03',
    });

    const { result } = renderHook(() => useSchools());

    await act(async () => {
      await result.current.createSchool(newSchool);
    });

    expect(masterService.createSchool).toHaveBeenCalledWith(newSchool);
  });

  it('should update an existing school', async () => {
    const updateData = { name: 'Escola A Atualizada' };
    vi.mocked(masterService.updateSchool).mockResolvedValue({
      id: 1,
      ...updateData,
      networkId: 1,
      substitutionLimitPerSemester: 10,
      priorityWindowHours: null,
      createdAt: '2026-01-01',
    });

    const { result } = renderHook(() => useSchools());

    await act(async () => {
      await result.current.updateSchool(1, updateData);
    });

    expect(masterService.updateSchool).toHaveBeenCalledWith(1, updateData);
  });

  it('should delete a school', async () => {
    vi.mocked(masterService.deleteSchool).mockResolvedValue();

    const { result } = renderHook(() => useSchools());

    await act(async () => {
      await result.current.deleteSchool(1);
    });

    expect(masterService.deleteSchool).toHaveBeenCalledWith(1);
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
  });
});