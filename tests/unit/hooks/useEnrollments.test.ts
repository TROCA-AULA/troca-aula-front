import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEnrollments } from '@/hooks/useEnrollments';
import { enrollmentService } from '@/services/enrollment.service';

vi.mock('@/services/enrollment.service', () => ({
  enrollmentService: {
    getEnrollments: vi.fn(),
    getAvailableClasses: vi.fn(),
  },
}));

describe('useEnrollments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega candidaturas e aulas disponíveis', async () => {
    const enrollments = [{ id: 1, classId: 10, professorId: 7, status: 'PENDING', createdAt: '2026-10-01' }];
    const classes = [{ id: 10, subjectId: 1, statededAt: null, available: true }];
    vi.mocked(enrollmentService.getEnrollments).mockResolvedValue(enrollments as any);
    vi.mocked(enrollmentService.getAvailableClasses).mockResolvedValue(classes as any);

    const { result } = renderHook(() => useEnrollments({ userId: 7 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.enrollments).toEqual(enrollments);
    expect(result.current.classes).toEqual(classes);
    expect(enrollmentService.getEnrollments).toHaveBeenCalledWith({ userId: 7 });
  });

  it('sem params, não busca candidaturas (só aulas)', async () => {
    vi.mocked(enrollmentService.getAvailableClasses).mockResolvedValue([]);

    const { result } = renderHook(() => useEnrollments());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(enrollmentService.getEnrollments).not.toHaveBeenCalled();
  });

  it('expõe mensagem de erro quando a busca falha', async () => {
    vi.mocked(enrollmentService.getAvailableClasses).mockRejectedValue(
      new Error('falhou'),
    );
    vi.mocked(enrollmentService.getEnrollments).mockResolvedValue([]);

    const { result } = renderHook(() => useEnrollments({ userId: 7 }));

    await waitFor(() => expect(result.current.error).toBe('falhou'));
    expect(result.current.loading).toBe(false);
  });
});
