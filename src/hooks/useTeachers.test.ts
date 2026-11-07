import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTeachers } from '@/hooks/useTeachers';
import { teacherService } from '@/services/teacher.service';
import type { Teacher, EnrollmentRequest } from '@/types/teacher';

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

const linkedTeachers: Teacher[] = [
  { id: 17, name: 'Maria', email: 'maria@e.com', profileId: 3, totalSubstitutions: 0 },
];

const availableTeachers: Teacher[] = [
  { id: 20, name: 'João', email: 'joao@e.com', profileId: 3, totalSubstitutions: 2 },
];

const enrollmentRequests: EnrollmentRequest[] = [
  {
    id: 1,
    classId: 10,
    professorId: 20,
    status: 'PENDING',
    createdAt: '2026-01-01',
  },
];

describe('useTeachers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia em loading e carrega os professores vinculados no mount', async () => {
    let resolveLinked!: (value: Teacher[]) => void;
    vi.mocked(teacherService.getLinkedTeachers).mockReturnValue(
      new Promise((resolve) => {
        resolveLinked = resolve;
      }),
    );

    const { result } = renderHook(() => useTeachers(6));

    expect(result.current.loading).toBe(true);
    expect(teacherService.getLinkedTeachers).toHaveBeenCalledWith(6);

    await act(async () => {
      resolveLinked(linkedTeachers);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.linkedTeachers).toEqual(linkedTeachers);
    expect(result.current.error).toBeNull();
    expect(teacherService.getAvailableTeachers).not.toHaveBeenCalled();
  });

  it('não busca nada no mount quando schoolId é zero', () => {
    const { result } = renderHook(() => useTeachers(0));

    expect(teacherService.getLinkedTeachers).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.linkedTeachers).toEqual([]);
  });

  it('busca professores disponíveis sob demanda', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.getAvailableTeachers).mockResolvedValue(
      availableTeachers,
    );

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchAvailableTeachers();
    });

    expect(teacherService.getAvailableTeachers).toHaveBeenCalledWith(6);
    expect(result.current.availableTeachers).toEqual(availableTeachers);
    expect(result.current.loading).toBe(false);
  });

  it('busca candidaturas repassando o status', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.getEnrollmentRequests).mockResolvedValue(
      enrollmentRequests,
    );

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchEnrollmentRequests('PENDING');
    });

    expect(teacherService.getEnrollmentRequests).toHaveBeenCalledWith(6, 'PENDING');
    expect(result.current.enrollmentRequests).toEqual(enrollmentRequests);
    expect(result.current.error).toBeNull();
  });

  it('expõe erro de Error ao buscar vinculados', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockRejectedValue(
      new Error('sem conexão'),
    );

    const { result } = renderHook(() => useTeachers(6));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('sem conexão');
  });

  it('expõe erro de Error ao buscar professores disponíveis', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.getAvailableTeachers).mockRejectedValue(
      new Error('catálogo fora do ar'),
    );

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchAvailableTeachers();
    });

    expect(result.current.error).toBe('catálogo fora do ar');
    expect(result.current.loading).toBe(false);
  });

  it('usa mensagens padrão quando os erros não são Error', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockRejectedValue('falhou');

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() =>
      expect(result.current.error).toBe('Failed to fetch linked teachers'),
    );

    vi.mocked(teacherService.getAvailableTeachers).mockRejectedValue('falhou');
    await act(async () => {
      await result.current.fetchAvailableTeachers();
    });
    expect(result.current.error).toBe('Failed to fetch available teachers');
    expect(result.current.loading).toBe(false);
  });

  it('expõe erro ao buscar candidaturas', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.getEnrollmentRequests).mockRejectedValue(
      new Error('indisponível'),
    );

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchEnrollmentRequests();
    });

    expect(result.current.error).toBe('indisponível');
    expect(result.current.loading).toBe(false);
  });

  it('usa mensagem padrão para erro de candidaturas que não é Error', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.getEnrollmentRequests).mockRejectedValue('falhou');

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchEnrollmentRequests('APPROVED');
    });

    expect(result.current.error).toBe('Failed to fetch enrollment requests');
  });

  it('vincula professor e recarrega as duas listas', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue(linkedTeachers);
    vi.mocked(teacherService.getAvailableTeachers).mockResolvedValue(
      availableTeachers,
    );
    vi.mocked(teacherService.linkTeacher).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.linkTeacher(20, 6);
    });

    expect(teacherService.linkTeacher).toHaveBeenCalledWith(20, 6);
    expect(teacherService.getLinkedTeachers).toHaveBeenCalledTimes(2);
    expect(teacherService.getAvailableTeachers).toHaveBeenCalledTimes(1);
    expect(result.current.availableTeachers).toEqual(availableTeachers);
    expect(result.current.loading).toBe(false);
  });

  it('expõe erro ao vincular professor', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.linkTeacher).mockRejectedValue(
      new Error('sem permissão'),
    );

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.linkTeacher(20, 6);
    });

    expect(result.current.error).toBe('sem permissão');
    expect(result.current.loading).toBe(false);
  });

  it('usa mensagem padrão ao falhar vínculo que não é Error', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.linkTeacher).mockRejectedValue('falhou');

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.linkTeacher(20, 6);
    });

    expect(result.current.error).toBe('Failed to link teacher');
  });

  it('desvincula professor e recarrega as duas listas', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue(linkedTeachers);
    vi.mocked(teacherService.getAvailableTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.unlinkTeacher).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.unlinkTeacher(17);
    });

    expect(teacherService.unlinkTeacher).toHaveBeenCalledWith(17, 6);
    expect(teacherService.getLinkedTeachers).toHaveBeenCalledTimes(2);
    expect(teacherService.getAvailableTeachers).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
  });

  it('expõe erro ao desvincular e usa mensagem padrão para erro não-Error', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.unlinkTeacher).mockRejectedValue(
      new Error('falha ao desvincular'),
    );

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.unlinkTeacher(17);
    });

    expect(result.current.error).toBe('falha ao desvincular');
  });

  it('atualiza o status de candidatura e busca novamente', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.getEnrollmentRequests).mockResolvedValue(
      enrollmentRequests,
    );
    vi.mocked(teacherService.updateEnrollmentStatus).mockResolvedValue(
      enrollmentRequests[0],
    );

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateEnrollmentStatus(1, 'APPROVED');
    });

    expect(teacherService.updateEnrollmentStatus).toHaveBeenCalledWith(1, 'APPROVED');
    expect(teacherService.getEnrollmentRequests).toHaveBeenCalledWith(6, undefined);
    expect(result.current.enrollmentRequests).toEqual(enrollmentRequests);
    expect(result.current.loading).toBe(false);
  });

  it('expõe erro ao atualizar status e usa mensagem padrão para erro não-Error', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.updateEnrollmentStatus).mockRejectedValue(
      new Error('não pode aprovar'),
    );

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateEnrollmentStatus(1, 'REJECTED');
    });

    expect(result.current.error).toBe('não pode aprovar');

    vi.mocked(teacherService.updateEnrollmentStatus).mockRejectedValue('falhou');
    await act(async () => {
      await result.current.updateEnrollmentStatus(1, 'REJECTED');
    });

    expect(result.current.error).toBe('Failed to update enrollment status');
  });

  it('usa mensagem padrão ao falhar desvínculo que não é Error', async () => {
    vi.mocked(teacherService.getLinkedTeachers).mockResolvedValue([]);
    vi.mocked(teacherService.unlinkTeacher).mockRejectedValue('falhou');

    const { result } = renderHook(() => useTeachers(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.unlinkTeacher(17);
    });

    expect(result.current.error).toBe('Failed to unlink teacher');
  });
});
