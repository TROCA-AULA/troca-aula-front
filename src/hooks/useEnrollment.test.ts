import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnrollmentMutations } from '@/hooks/useEnrollment';
import { enrollmentService } from '@/services/enrollment.service';

vi.mock('@/services/enrollment.service', () => ({
  enrollmentService: {
    createEnrollment: vi.fn(),
    approveEnrollment: vi.fn(),
    rejectEnrollment: vi.fn(),
    cancelEnrollment: vi.fn(),
  },
}));

describe('useEnrollmentMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delega cada operação para o service', async () => {
    vi.mocked(enrollmentService.createEnrollment).mockResolvedValue({ id: 1 } as any);
    vi.mocked(enrollmentService.approveEnrollment).mockResolvedValue({ id: 1 } as any);
    vi.mocked(enrollmentService.rejectEnrollment).mockResolvedValue({ id: 1 } as any);
    vi.mocked(enrollmentService.cancelEnrollment).mockResolvedValue({ id: 1 } as any);

    const { result } = renderHook(() => useEnrollmentMutations());

    await act(async () => {
      await result.current.createEnrollment({ classId: 10 });
      await result.current.approveEnrollment(1);
      await result.current.rejectEnrollment(2, 'sem vaga');
      await result.current.cancelEnrollment(3);
    });

    expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({ classId: 10 });
    expect(enrollmentService.approveEnrollment).toHaveBeenCalledWith(1);
    expect(enrollmentService.rejectEnrollment).toHaveBeenCalledWith(2, 'sem vaga');
    expect(enrollmentService.cancelEnrollment).toHaveBeenCalledWith(3);
  });

  it('registra o erro e repropaga quando o service falha', async () => {
    vi.mocked(enrollmentService.approveEnrollment).mockRejectedValue(
      new Error('não pode aprovar'),
    );

    const { result } = renderHook(() => useEnrollmentMutations());

    await act(async () => {
      await expect(result.current.approveEnrollment(1)).rejects.toThrow(
        'não pode aprovar',
      );
    });

    expect(result.current.error).toBe('não pode aprovar');
    expect(result.current.loading).toBe(false);
  });

  it('registra erro de criação, rejeição e cancelamento', async () => {
    vi.mocked(enrollmentService.createEnrollment).mockRejectedValue(
      new Error('falha ao criar'),
    );
    vi.mocked(enrollmentService.rejectEnrollment).mockRejectedValue(
      new Error('falha ao rejeitar'),
    );
    vi.mocked(enrollmentService.cancelEnrollment).mockRejectedValue(
      new Error('falha ao cancelar'),
    );

    const { result } = renderHook(() => useEnrollmentMutations());

    await act(async () => {
      await expect(
        result.current.createEnrollment({ classId: 10 }),
      ).rejects.toThrow('falha ao criar');
    });
    expect(result.current.error).toBe('falha ao criar');

    await act(async () => {
      await expect(
        result.current.rejectEnrollment(2, 'sem vaga'),
      ).rejects.toThrow('falha ao rejeitar');
    });
    expect(result.current.error).toBe('falha ao rejeitar');

    await act(async () => {
      await expect(result.current.cancelEnrollment(3)).rejects.toThrow(
        'falha ao cancelar',
      );
    });
    expect(result.current.error).toBe('falha ao cancelar');
    expect(result.current.loading).toBe(false);
  });

  it('usa mensagens padrão quando o erro não é Error', async () => {
    vi.mocked(enrollmentService.createEnrollment).mockRejectedValue(
      'falhou' as unknown as Error,
    );
    vi.mocked(enrollmentService.approveEnrollment).mockRejectedValue(
      'falhou' as unknown as Error,
    );
    vi.mocked(enrollmentService.rejectEnrollment).mockRejectedValue(
      'falhou' as unknown as Error,
    );
    vi.mocked(enrollmentService.cancelEnrollment).mockRejectedValue(
      'falhou' as unknown as Error,
    );

    const { result } = renderHook(() => useEnrollmentMutations());

    await act(async () => {
      await expect(result.current.createEnrollment({ classId: 10 })).rejects.toBe(
        'falhou',
      );
    });
    expect(result.current.error).toBe('Erro ao criar candidatura');

    await act(async () => {
      await expect(result.current.approveEnrollment(1)).rejects.toBe('falhou');
    });
    expect(result.current.error).toBe('Erro ao aprovar candidatura');

    await act(async () => {
      await expect(result.current.rejectEnrollment(2)).rejects.toBe('falhou');
    });
    expect(result.current.error).toBe('Erro ao rejeitar candidatura');

    await act(async () => {
      await expect(result.current.cancelEnrollment(3)).rejects.toBe('falhou');
    });
    expect(result.current.error).toBe('Erro ao cancelar candidatura');
    expect(result.current.loading).toBe(false);
  });
});
