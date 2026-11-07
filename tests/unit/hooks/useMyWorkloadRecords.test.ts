import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyWorkloadRecords } from '@/hooks/useMyWorkloadRecords';
import { teacherWorkloadService } from '@/services/teacher-workload.service';

vi.mock('@/services/teacher-workload.service', () => ({
  teacherWorkloadService: {
    getMine: vi.fn(),
  },
}));

const mockRecords = [
  {
    id: 1,
    userId: 3,
    schoolId: 1,
    networkId: 1,
    workloadTypeId: 4,
    hours: '6',
    ataOficialRef: null,
    validFrom: '2026-10-01',
    validTo: null,
    createdById: 2,
    createdAt: '2026-10-01',
    school: { id: 1, name: 'Escola Bootstrap' },
  },
];

describe('useMyWorkloadRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the professor own records on mount, without needing a schoolId', async () => {
    vi.mocked(teacherWorkloadService.getMine).mockResolvedValue(mockRecords);

    const { result } = renderHook(() => useMyWorkloadRecords());

    await waitFor(() => expect(result.current.records).toEqual(mockRecords));
    expect(teacherWorkloadService.getMine).toHaveBeenCalledTimes(1);
  });

  it('starts in a loading state', () => {
    vi.mocked(teacherWorkloadService.getMine).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMyWorkloadRecords());

    expect(result.current.loading).toBe(true);
  });

  it('sets an error message when the request fails', async () => {
    vi.mocked(teacherWorkloadService.getMine).mockRejectedValue(new Error('Falha na rede'));

    const { result } = renderHook(() => useMyWorkloadRecords());

    await waitFor(() => expect(result.current.error).toBe('Falha na rede'));
    expect(result.current.loading).toBe(false);
  });
});
