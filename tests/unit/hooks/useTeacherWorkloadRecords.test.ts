import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTeacherWorkloadRecords } from '@/hooks/useTeacherWorkloadRecords';
import { teacherWorkloadService } from '@/services/teacher-workload.service';

vi.mock('@/services/teacher-workload.service', () => ({
  teacherWorkloadService: {
    getBySchool: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockRecords = [
  { id: 1, userId: 3, schoolId: 1, networkId: 1, workloadTypeId: 4, hours: '6', ataOficialRef: null, validFrom: '2026-10-01', validTo: null, createdById: 2, createdAt: '2026-10-01' },
];

describe('useTeacherWorkloadRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when schoolId is null', () => {
    renderHook(() => useTeacherWorkloadRecords(null));
    expect(teacherWorkloadService.getBySchool).not.toHaveBeenCalled();
  });

  it('loads records for the given school', async () => {
    vi.mocked(teacherWorkloadService.getBySchool).mockResolvedValue(mockRecords);

    const { result } = renderHook(() => useTeacherWorkloadRecords(1));

    await waitFor(() => expect(result.current.records).toEqual(mockRecords));
    expect(teacherWorkloadService.getBySchool).toHaveBeenCalledWith(1);
  });

  it('creates a record and appends it to state', async () => {
    vi.mocked(teacherWorkloadService.getBySchool).mockResolvedValue([]);
    const newRecord = mockRecords[0];
    vi.mocked(teacherWorkloadService.create).mockResolvedValue(newRecord);

    const { result } = renderHook(() => useTeacherWorkloadRecords(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createRecord({
        userId: 3,
        schoolId: 1,
        workloadTypeId: 4,
        hours: 6,
        validFrom: '2026-10-01',
      });
    });

    expect(result.current.records).toEqual([newRecord]);
  });

  it('propagates errors from create (e.g. workload policy limit exceeded)', async () => {
    vi.mocked(teacherWorkloadService.getBySchool).mockResolvedValue([]);
    const error = { response: { data: { message: 'limite excedido' } } };
    vi.mocked(teacherWorkloadService.create).mockRejectedValue(error);

    const { result } = renderHook(() => useTeacherWorkloadRecords(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      result.current.createRecord({
        userId: 3,
        schoolId: 1,
        workloadTypeId: 4,
        hours: 100,
        validFrom: '2026-10-01',
      }),
    ).rejects.toBe(error);
  });

  it('removes a record from state', async () => {
    vi.mocked(teacherWorkloadService.getBySchool).mockResolvedValue(mockRecords);
    vi.mocked(teacherWorkloadService.remove).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTeacherWorkloadRecords(1));
    await waitFor(() => expect(result.current.records).toHaveLength(1));

    await act(async () => {
      await result.current.removeRecord(1);
    });

    expect(result.current.records).toHaveLength(0);
  });
});
