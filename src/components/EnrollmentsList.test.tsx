import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnrollmentsList } from './EnrollmentsList';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useEnrollmentMutations } from '@/hooks/useEnrollment';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

vi.mock('@/hooks/useEnrollments', () => ({ useEnrollments: vi.fn() }));
vi.mock('@/hooks/useEnrollment', () => ({ useEnrollmentMutations: vi.fn() }));
vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const approveEnrollment = vi.fn();
const rejectEnrollment = vi.fn();
const refetch = vi.fn();

const enrollments = [
  {
    id: 1,
    classId: 10,
    professorId: 7,
    status: 'PENDING' as const,
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 2,
    classId: 11,
    professorId: 8,
    status: 'APPROVED' as const,
    createdAt: '2026-10-02T12:30:00Z',
  },
  {
    id: 3,
    classId: 12,
    professorId: 9,
    status: 'REJECTED' as const,
    createdAt: '2026-10-03T08:00:00Z',
  },
  {
    id: 4,
    classId: 13,
    professorId: 10,
    status: 'CANCELLED' as const,
    createdAt: '2026-10-04T09:00:00Z',
  },
];

function mockList(overrides: Record<string, unknown> = {}) {
  vi.mocked(useEnrollments).mockReturnValue({
    enrollments,
    classes: [],
    loading: false,
    error: null,
    refetch,
    ...overrides,
  } as any);
}

function mockMutations(processing = false) {
  vi.mocked(useEnrollmentMutations).mockReturnValue({
    createEnrollment: vi.fn(),
    approveEnrollment,
    rejectEnrollment,
    cancelEnrollment: vi.fn(),
    loading: processing,
    error: null,
  } as any);
}

describe('EnrollmentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList();
    mockMutations();
  });

  it('mostra o estado de carregamento', () => {
    mockList({ loading: true });
    render(<EnrollmentsList schoolId={4} />);

    expect(screen.getByText('Carregando candidaturas...')).toBeInTheDocument();
  });

  it('mostra a mensagem de erro quando a busca falha', () => {
    mockList({ error: 'Falha ao carregar' });
    render(<EnrollmentsList schoolId={4} />);

    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
  });

  it('busca as candidaturas pendentes da escola por padrão', () => {
    render(<EnrollmentsList schoolId={4} />);

    expect(useEnrollments).toHaveBeenCalledWith({ status: 'PENDING', schoolId: 4 });
    expect(screen.getByText('Pendentes')).toHaveClass('active');
  });

  it('lista as candidaturas com status traduzido, professor, aula e data', () => {
    render(<EnrollmentsList />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Professor #7')).toBeInTheDocument();
    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Aprovada')).toBeInTheDocument();
    expect(screen.getByText('Rejeitada')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    // Data formatada em pt-BR (dd/MM/yyyy HH:mm), respeitando o fuso local.
    expect(
      screen.getByText(format(new Date('2026-10-01T10:00:00Z'), 'dd/MM/yyyy HH:mm')),
    ).toBeInTheDocument();
  });

  it('só mostra as ações de aprovar/rejeitar para candidaturas pendentes', () => {
    render(<EnrollmentsList />);

    expect(screen.getAllByText('Aprovar')).toHaveLength(1);
    expect(screen.getAllByText('Rejeitar')).toHaveLength(1);
  });

  it('troca o filtro e refaz a busca com o status escolhido', () => {
    render(<EnrollmentsList schoolId={4} />);

    fireEvent.click(screen.getByText('Aprovadas'));

    expect(screen.getByText('Aprovadas')).toHaveClass('active');
    expect(useEnrollments).toHaveBeenLastCalledWith({ status: 'APPROVED', schoolId: 4 });
  });

  it('mostra o estado vazio conforme o filtro ativo', () => {
    mockList({ enrollments: [] });
    render(<EnrollmentsList />);

    expect(screen.getByText('Nenhuma candidatura pending encontrada.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Rejeitadas'));
    expect(screen.getByText('Nenhuma candidatura rejected encontrada.')).toBeInTheDocument();
  });

  it('aprova uma candidatura, mostra o toast e recarrega a lista', async () => {
    approveEnrollment.mockResolvedValue({ id: 1 });
    render(<EnrollmentsList />);

    fireEvent.click(screen.getByText('Aprovar'));

    await waitFor(() => {
      expect(approveEnrollment).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('Candidatura aprovada com sucesso!');
      expect(refetch).toHaveBeenCalled();
    });
  });

  it('mostra o erro ao falhar a aprovação', async () => {
    approveEnrollment.mockRejectedValue(new Error('Sem permissão'));
    render(<EnrollmentsList />);

    fireEvent.click(screen.getByText('Aprovar'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sem permissão'));
  });

  it('usa a mensagem padrão quando a falha de aprovação não é um Error', async () => {
    approveEnrollment.mockRejectedValue('falha');
    render(<EnrollmentsList />);

    fireEvent.click(screen.getByText('Aprovar'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao aprovar candidatura'),
    );
  });

  it('rejeita uma candidatura com o motivo informado', async () => {
    const promptSpy = vi.fn().mockReturnValue('Professor já lotado');
    vi.stubGlobal('prompt', promptSpy);
    rejectEnrollment.mockResolvedValue({ id: 1 });
    render(<EnrollmentsList />);

    fireEvent.click(screen.getByText('Rejeitar'));

    await waitFor(() => {
      expect(promptSpy).toHaveBeenCalledWith('Motivo da rejeição (opcional):');
      expect(rejectEnrollment).toHaveBeenCalledWith(1, 'Professor já lotado');
      expect(toast.success).toHaveBeenCalledWith('Candidatura rejeitada!');
      expect(refetch).toHaveBeenCalled();
    });
    vi.unstubAllGlobals();
  });

  it('rejeita sem motivo quando o prompt é cancelado', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValue(null));
    rejectEnrollment.mockResolvedValue({ id: 1 });
    render(<EnrollmentsList />);

    fireEvent.click(screen.getByText('Rejeitar'));

    await waitFor(() => expect(rejectEnrollment).toHaveBeenCalledWith(1, undefined));
    vi.unstubAllGlobals();
  });

  it('mostra o erro ao falhar a rejeição', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('motivo'));
    rejectEnrollment.mockRejectedValue(new Error('Falha na rejeição'));
    render(<EnrollmentsList />);

    fireEvent.click(screen.getByText('Rejeitar'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Falha na rejeição'));
    vi.unstubAllGlobals();
  });

  it('usa a mensagem padrão quando a falha de rejeição não é um Error', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValue(null));
    rejectEnrollment.mockRejectedValue('falha');
    render(<EnrollmentsList />);

    fireEvent.click(screen.getByText('Rejeitar'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao rejeitar candidatura'),
    );
    vi.unstubAllGlobals();
  });

  it('desabilita as ações enquanto uma candidatura está sendo processada', () => {
    mockMutations(true);
    render(<EnrollmentsList />);

    expect(screen.getByText('Aprovar')).toBeDisabled();
    expect(screen.getByText('Rejeitar')).toBeDisabled();
  });

  it('renderiza um status desconhecido sem quebrar o badge', () => {
    mockList({
      enrollments: [
        {
          id: 9,
          classId: 99,
          professorId: 7,
          status: 'UNKNOWN',
          createdAt: '2026-10-05T10:00:00Z',
        },
      ],
    });
    render(<EnrollmentsList />);

    expect(screen.getByText('#9')).toBeInTheDocument();
  });
});
