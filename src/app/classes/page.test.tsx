import { render, screen, fireEvent, waitFor, act } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClassesPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useEnrollmentMutations } from '@/hooks/useEnrollment';
import { useSubstitutionLimit } from '@/hooks/useSubstitutionLimit';
import { toast } from 'react-toastify';
import { PROFILE } from '@/constants/profile';

// Dispara o onClick do React mesmo em botão desabilitado (o jsdom não emite
// clique em botões desabilitados, mas o handler continua acessível via props).
function invokeReactOnClick(element: HTMLElement) {
  const key = Object.keys(element).find((k) => k.startsWith('__reactProps$'));
  const props = (element as unknown as Record<string, { onClick?: () => void }>)[key!];
  act(() => {
    props.onClick?.();
  });
}

const push = vi.fn();
const refetch = vi.fn();
const createEnrollment = vi.fn();

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

vi.mock('@/hooks/useSubstitutionLimit', () => ({
  useSubstitutionLimit: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

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

describe('ClassesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEnrollments).mockReturnValue({
      classes: [
        {
          id: 10,
          subjectId: 1,
          subjectName: 'Matemática',
          statededAt: '2026-10-01T10:00:00Z',
          available: true,
        },
      ],
      enrollments: [],
      loading: false,
      error: null,
      refetch,
    });
    vi.mocked(useEnrollmentMutations).mockReturnValue({
      createEnrollment,
      loading: false,
    } as any);
    vi.mocked(useSubstitutionLimit).mockReturnValue({
      current: 1,
      limit: 10,
      percentage: 10,
      canApply: true,
      loading: false,
      error: null,
    });
  });

  it('lista as aulas disponíveis e envia a candidatura', async () => {
    mockUser();
    createEnrollment.mockResolvedValue({ id: 1 });

    render(<ClassesPage />);

    expect(screen.getByText('Matemática')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Candidatar-se'));

    await waitFor(() => {
      expect(createEnrollment).toHaveBeenCalledWith({ classId: 10 });
      expect(toast.success).toHaveBeenCalledWith('Candidatura enviada com sucesso!');
      expect(refetch).toHaveBeenCalled();
    });
  });

  it('desabilita a candidatura quando o limite foi atingido', () => {
    mockUser();
    vi.mocked(useSubstitutionLimit).mockReturnValue({
      current: 10,
      limit: 10,
      percentage: 100,
      canApply: false,
      loading: false,
      error: null,
    });

    render(<ClassesPage />);

    const button = screen.getByText('Limite atingido');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(createEnrollment).not.toHaveBeenCalled();
  });

  it('mostra o aviso de limite mesmo se o handler for acionado com o botão bloqueado', () => {
    mockUser();
    vi.mocked(useSubstitutionLimit).mockReturnValue({
      current: 10,
      limit: 10,
      percentage: 100,
      canApply: false,
      loading: false,
      error: null,
    });

    render(<ClassesPage />);
    invokeReactOnClick(screen.getByText('Limite atingido'));

    expect(toast.error).toHaveBeenCalledWith(
      'Não é possível se candidatar. Limite de 10 substituições atingido para este semestre.',
    );
    expect(createEnrollment).not.toHaveBeenCalled();
  });

  it('redireciona MASTER para /master', () => {
    mockUser(PROFILE.MASTER);

    render(<ClassesPage />);

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

    render(<ClassesPage />);

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

    render(<ClassesPage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('mostra o carregando das aulas disponíveis', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      classes: [],
      enrollments: [],
      loading: true,
      error: null,
      refetch,
    });

    render(<ClassesPage />);

    expect(screen.getByText('Carregando aulas disponíveis...')).toBeInTheDocument();
  });

  it('mostra o erro ao carregar as aulas', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      classes: [],
      enrollments: [],
      loading: false,
      error: 'Falha ao carregar aulas',
      refetch,
    });

    render(<ClassesPage />);

    expect(screen.getByText('Falha ao carregar aulas')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há aulas disponíveis', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      classes: [],
      enrollments: [],
      loading: false,
      error: null,
      refetch,
    });

    render(<ClassesPage />);

    expect(screen.getByText('Nenhuma aula disponível no momento.')).toBeInTheDocument();
  });

  it('desabilita o botão de aula indisponível', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      classes: [
        {
          id: 20,
          subjectId: 1,
          subjectName: 'Física',
          statededAt: '2026-10-05T10:00:00Z',
          available: false,
        },
      ],
      enrollments: [],
      loading: false,
      error: null,
      refetch,
    });

    render(<ClassesPage />);

    expect(screen.getByText('Indisponível')).toBeDisabled();
  });

  it('usa "Aula #id" e "-" quando faltam dados da aula', () => {
    mockUser();
    vi.mocked(useEnrollments).mockReturnValue({
      classes: [
        {
          id: 21,
          subjectId: 1,
          statededAt: null,
          available: true,
        },
      ],
      enrollments: [],
      loading: false,
      error: null,
      refetch,
    });

    render(<ClassesPage />);

    expect(screen.getByText('Aula #21')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('mostra o erro ao falhar o envio da candidatura', async () => {
    mockUser();
    createEnrollment.mockRejectedValue(new Error('Candidatura duplicada'));

    render(<ClassesPage />);
    fireEvent.click(screen.getByText('Candidatar-se'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Candidatura duplicada'),
    );
  });

  it('usa a mensagem padrão quando a candidatura falha sem Error', async () => {
    mockUser();
    createEnrollment.mockRejectedValue('falha');

    render(<ClassesPage />);
    fireEvent.click(screen.getByText('Candidatar-se'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao enviar candidatura'),
    );
  });
});
