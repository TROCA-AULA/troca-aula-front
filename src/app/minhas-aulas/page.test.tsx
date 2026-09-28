import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MinhasAulasPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useEnrollmentMutations } from '@/hooks/useEnrollment';
import { toast } from 'react-toastify';
import { PROFILE } from '@/constants/profile';

const push = vi.fn();
const refetch = vi.fn();
const cancelEnrollment = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/hooks/useEnrollments', () => ({
  useEnrollments: vi.fn(),
}));

vi.mock('@/hooks/useEnrollment', () => ({
  useEnrollmentMutations: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

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
    professorId: 7,
    status: 'APPROVED' as const,
    createdAt: '2026-10-02T10:00:00Z',
  },
];

function mockUser(profileId: number = PROFILE.PROFESSOR) {
  vi.mocked(useSchoolContext).mockReturnValue({
    user: { id: 7, name: 'Professor', email: 'p@e.com', profileId, schoolId: 1 },
    isLoading: false,
    logout: vi.fn(),
    refreshUserData: vi.fn(),
    schoolLinks: [],
    activeSchoolId: 1,
    activeProfileId: profileId,
    activeNetworkId: null,
    setActiveSchoolId: vi.fn(),
  } as any);
}

describe('MinhasAulasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEnrollments).mockReturnValue({
      enrollments,
      classes: [],
      loading: false,
      error: null,
      refetch,
    });
    vi.mocked(useEnrollmentMutations).mockReturnValue({
      cancelEnrollment,
      loading: false,
    } as any);
  });

  it('lista as candidaturas com o status traduzido', () => {
    mockUser();

    render(<MinhasAulasPage />);

    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Aprovada')).toBeInTheDocument();
  });

  it('cancela uma candidatura pendente', async () => {
    mockUser();
    cancelEnrollment.mockResolvedValue({ id: 1 });

    render(<MinhasAulasPage />);

    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(cancelEnrollment).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('Candidatura cancelada com sucesso!');
      expect(refetch).toHaveBeenCalled();
    });
  });

  it('filtra pelo status selecionado na aba', () => {
    mockUser();

    render(<MinhasAulasPage />);

    fireEvent.click(screen.getByText('Aprovadas'));

    expect(screen.getByText('#11')).toBeInTheDocument();
    expect(screen.queryByText('#10')).not.toBeInTheDocument();
  });

  it('redireciona MASTER para /master', () => {
    mockUser(PROFILE.MASTER);

    render(<MinhasAulasPage />);

    expect(push).toHaveBeenCalledWith('/master');
  });

  it('redireciona para o login quando não há usuário', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: null,
      isLoading: false,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: null,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    } as any);

    render(<MinhasAulasPage />);

    expect(push).toHaveBeenCalledWith('/');
  });

  it('mostra o carregando enquanto o usuário não chega', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: null,
      isLoading: true,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: null,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    } as any);

    render(<MinhasAulasPage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('mostra o carregando das candidaturas', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      enrollments: [],
      classes: [],
      loading: true,
      error: null,
      refetch,
    });

    render(<MinhasAulasPage />);

    expect(screen.getByText('Carregando minhas candidaturas...')).toBeInTheDocument();
  });

  it('mostra o erro ao carregar as candidaturas', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      enrollments: [],
      classes: [],
      loading: false,
      error: 'Falha ao carregar',
      refetch,
    });

    render(<MinhasAulasPage />);

    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
  });

  it('mostra o estado vazio geral quando não há candidaturas', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      enrollments: [],
      classes: [],
      loading: false,
      error: null,
      refetch,
    });

    render(<MinhasAulasPage />);

    expect(screen.getByText('Você ainda não tem candidaturas.')).toBeInTheDocument();
  });

  it('mostra o estado vazio conforme o filtro selecionado', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      enrollments: [],
      classes: [],
      loading: false,
      error: null,
      refetch,
    });

    render(<MinhasAulasPage />);
    fireEvent.click(screen.getByText('Pendentes'));

    expect(screen.getByText('Nenhuma candidatura pending.')).toBeInTheDocument();
  });

  it('mostra rejeitada, cancelada e o motivo da rejeição', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      enrollments: [
        {
          id: 3,
          classId: 12,
          professorId: 7,
          status: 'REJECTED',
          rejectionReason: 'Sem vaga no turno',
          createdAt: '2026-10-03T10:00:00Z',
        },
        {
          id: 4,
          classId: 13,
          professorId: 7,
          status: 'CANCELLED',
          createdAt: '2026-10-04T10:00:00Z',
        },
      ],
      classes: [],
      loading: false,
      error: null,
      refetch,
    });

    render(<MinhasAulasPage />);

    expect(screen.getByText('Rejeitada')).toBeInTheDocument();
    expect(screen.getByText('Sem vaga no turno')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Canceladas'));
    expect(screen.getByText('#13')).toBeInTheDocument();
    expect(screen.queryByText('#12')).not.toBeInTheDocument();
  });

  it('mostra o erro ao falhar o cancelamento', async () => {
    mockUser();
    cancelEnrollment.mockRejectedValue(new Error('Candidatura já processada'));

    render(<MinhasAulasPage />);
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Candidatura já processada'),
    );
  });

  it('usa a mensagem padrão quando o cancelamento falha sem Error', async () => {
    mockUser();
    cancelEnrollment.mockRejectedValue('falha');

    render(<MinhasAulasPage />);
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao cancelar candidatura'),
    );
  });

  it('renderiza um status desconhecido sem quebrar o badge', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      enrollments: [
        {
          id: 9,
          classId: 99,
          professorId: 7,
          status: 'UNKNOWN' as any,
          createdAt: '2026-10-05T10:00:00Z',
        },
      ],
      classes: [],
      loading: false,
      error: null,
      refetch,
    });

    render(<MinhasAulasPage />);

    expect(screen.getByText('#99')).toBeInTheDocument();
  });
});
