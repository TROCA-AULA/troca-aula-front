import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTeachers } from '@/hooks/useTeachers';
import { teacherService } from '@/services/teacher.service';

vi.mock('@/services/teacher.service', () => ({
  teacherService: {
    getLinkedTeachers: vi.fn(),
    getAvailableTeachers: vi.fn(),
    getEnrollmentRequests: vi.fn(),
    linkTeacher: vi.fn(),
    unlinkTeacher: vi.fn(),
    updateEnrollmentStatus: vi.fn(),
  },
}));

const mockLinkedTeachers = [
  {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao@escola.com',
    schoolId: 'school-1',
    profileId: 4,
    subject: { id: 'subj-1', name: 'Matemática' },
    totalSubstitutions: 15,
  },
];

const mockAvailableTeachers = [
  {
    id: 'user-2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    schoolId: null,
    profileId: 4,
    subject: { id: 'subj-2', name: 'Física' },
    totalSubstitutions: 8,
  },
];

const mockEnrollmentRequests = [
  {
    id: 'enr-1',
    userId: 'user-2',
    schoolId: 'school-1',
    status: 'PENDING',
    appliedAt: '2026-05-17T10:00:00Z',
    user: mockAvailableTeachers[0],
  },
];

describe('useTeachers Hook - US1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load linked teachers on mount', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue(
      mockLinkedTeachers
    );

    const { result } = renderHook(() => useTeachers('school-1'));

    await waitFor(() =>
      expect(result.current.linkedTeachers).toEqual(mockLinkedTeachers)
    );
    expect(teacherService.getLinkedTeachers).toHaveBeenCalledWith('school-1');
  });

  it('should fetch available teachers', async () => {
    vi.mocked(teacherService.getAvailableTeachers).mockResolvedValue(
      mockAvailableTeachers
    );

    const { result } = renderHook(() => useTeachers('school-1'));

    await act(async () => {
      await result.current.fetchAvailableTeachers();
    });

    expect(result.current.availableTeachers).toEqual(mockAvailableTeachers);
  });

  it('should link a teacher to school', async () => {
    vi.mocked(teacherService.linkTeacher).mockResolvedValue({
      id: 'user-2',
      schoolId: 'school-1',
    } as any);
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([
      ...mockLinkedTeachers,
      { ...mockAvailableTeachers[0], schoolId: 'school-1' },
    ]);
    vi.mocked(teacherService.getAvailableTeachers).mockResolvedValue([]);

    const { result } = renderHook(() => useTeachers('school-1'));

    await act(async () => {
      await result.current.linkTeacher('user-2', 'school-1');
    });

    expect(teacherService.linkTeacher).toHaveBeenCalledWith(
      'user-2',
      'school-1'
    );
  });

  it('should unlink a teacher from school', async () => {
    vi.mocked(teacherService.unlinkTeacher).mockResolvedValue(undefined);
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.getAvailableTeachers).mockResolvedValue(
      mockAvailableTeachers
    );

    const { result } = renderHook(() => useTeachers('school-1'));

    await act(async () => {
      await result.current.unlinkTeacher('user-1');
    });

    // useTeachers já conhece o schoolId (veio do parâmetro do hook) e o
    // injeta automaticamente — o backend real exige profileId+schoolId no
    // corpo do unassign-profile (ver P15 em problemas-conhecidos.md).
    expect(teacherService.unlinkTeacher).toHaveBeenCalledWith(
      'user-1',
      'school-1'
    );
  });

  it('should handle loading state', () => {
    vi.mocked(teacherService.getLinkedTeachers).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useTeachers('school-1'));

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useTeachers('school-1'));

    await waitFor(() => expect(result.current.error).toBe('API Error'));
  });

  it('should fetch enrollment requests', async () => {
    vi.mocked(teacherService.getEnrollmentRequests).mockResolvedValue(
      mockEnrollmentRequests
    );

    const { result } = renderHook(() => useTeachers('school-1'));

    await act(async () => {
      await result.current.fetchEnrollmentRequests();
    });

    expect(result.current.enrollmentRequests).toEqual(mockEnrollmentRequests);
  });

  it('should update enrollment status', async () => {
    vi.mocked(teacherService.updateEnrollmentStatus).mockResolvedValue({
      id: 'enr-1',
      status: 'APPROVED',
    } as any);
    vi.mocked(teacherService.getEnrollmentRequests).mockResolvedValue([]);

    const { result } = renderHook(() => useTeachers('school-1'));

    await act(async () => {
      await result.current.updateEnrollmentStatus('enr-1', 'APPROVED');
    });

    expect(teacherService.updateEnrollmentStatus).toHaveBeenCalledWith(
      'enr-1',
      'APPROVED'
    );
  });
});
