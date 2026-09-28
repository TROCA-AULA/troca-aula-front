import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfessoresPage from './page';
import { useTeachers } from '@/hooks/useTeachers';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { accountService } from '@/services/account.service';
import { toast } from 'react-toastify';

vi.mock('@/hooks/useTeachers', () => ({ useTeachers: vi.fn() }));
vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));
vi.mock('@/services/account.service', () => ({
  accountService: { resetUserPassword: vi.fn() },
}));
vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const linkTeacher = vi.fn();
const unlinkTeacher = vi.fn();
const updateEnrollmentStatus = vi.fn();
const fetchLinkedTeachers = vi.fn();
const fetchAvailableTeachers = vi.fn();
const fetchEnrollmentRequests = vi.fn();

function mockTeachers(overrides: Record<string, unknown> = {}) {
  vi.mocked(useTeachers).mockReturnValue({
    linkedTeachers: [
      {
        id: 7,
        name: 'Maria',
        email: 'maria@escola.com',
        profileId: 3,
        subject: { id: 1, name: 'Matemática' },
        totalSubstitutions: 2,
      },
    ],
    availableTeachers: [],
    enrollmentRequests: [],
    loading: false,
    error: null,
    fetchLinkedTeachers,
    fetchAvailableTeachers,
    fetchEnrollmentRequests,
    linkTeacher,
    unlinkTeacher,
    updateEnrollmentStatus,
    ...overrides,
  } as any);
}

describe('ProfessoresPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 1, name: 'Master', email: 'm@e.com', profileId: 4 },
      isLoading: false,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: 4,
      activeProfileId: 4,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    } as any);
    mockTeachers();
  });

  it('lista professores vinculados', () => {
    render(<ProfessoresPage />);

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('maria@escola.com')).toBeInTheDocument();
    expect(screen.getByText('Matemática')).toBeInTheDocument();
    // a escola ativa vai para o hook (P15: filtro real do servidor)
    expect(useTeachers).toHaveBeenCalledWith(4);
  });

  it('mostra vazio quando não há professores vinculados', () => {
    mockTeachers({ linkedTeachers: [] });

    render(<ProfessoresPage />);

    expect(screen.getByText('Nenhum professor vinculado')).toBeInTheDocument();
  });

  it('redefine a senha e mostra a senha temporária no toast', async () => {
    vi.mocked(accountService.resetUserPassword).mockResolvedValue({
      tempPassword: 'abc12345',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Redefinir senha de Maria'));

    await waitFor(() => {
      expect(accountService.resetUserPassword).toHaveBeenCalledWith(7);
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('abc12345'),
        expect.objectContaining({ autoClose: false }),
      );
    });
  });

  it('desvincula o professor com confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    unlinkTeacher.mockResolvedValue(undefined);

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Desvincular Maria'));

    await waitFor(() => {
      expect(unlinkTeacher).toHaveBeenCalledWith(7);
      expect(toast.success).toHaveBeenCalledWith(
        'Professor desvinculado com sucesso!',
      );
    });
  });

  it('aprova candidatura na aba de candidaturas', async () => {
    updateEnrollmentStatus.mockResolvedValue(undefined);
    mockTeachers({
      enrollmentRequests: [
        {
          id: 9,
          classId: 10,
          professorId: 7,
          status: 'PENDING',
          createdAt: '2026-10-01',
          user: {
            id: 7,
            name: 'Maria',
            email: 'maria@escola.com',
            subject: { id: 1, name: 'Matemática' },
            totalSubstitutions: 2,
          },
        },
      ],
    });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByText('Candidaturas'));

    fireEvent.click(screen.getByText('Aprovar'));

    await waitFor(() => {
      expect(updateEnrollmentStatus).toHaveBeenCalledWith(9, 'APPROVED');
      expect(toast.success).toHaveBeenCalledWith('Candidatura aprovada!');
    });
  });

  it('filtra candidaturas pelo status', () => {
    render(<ProfessoresPage />);
    fireEvent.click(screen.getByText('Candidaturas'));

    fireEvent.change(screen.getByLabelText('Filtrar candidaturas por status'), {
      target: { value: 'PENDING' },
    });

    expect(fetchEnrollmentRequests).toHaveBeenCalledWith('PENDING');
  });

  it('mostra erro do hook', () => {
    mockTeachers({ error: 'falha ao carregar' });

    render(<ProfessoresPage />);

    expect(screen.getByText(/falha ao carregar/)).toBeInTheDocument();
  });

  it('abre o modal de vínculo, lista disponíveis e vincula o professor', async () => {
    fetchAvailableTeachers.mockResolvedValue(undefined);
    linkTeacher.mockResolvedValue(undefined);
    mockTeachers({
      availableTeachers: [
        {
          id: 11,
          name: 'Ana',
          email: 'ana@escola.com',
          profileId: 3,
          subject: { id: 2, name: 'História' },
          totalSubstitutions: 1,
        },
      ],
    });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Vincular Professor'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText(/ana@escola.com/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Vincular Ana'));

    await waitFor(() => {
      expect(linkTeacher).toHaveBeenCalledWith(11, 4);
      expect(toast.success).toHaveBeenCalledWith(
        'Professor vinculado com sucesso!',
      );
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra vazio no modal e permite fechá-lo', async () => {
    fetchAvailableTeachers.mockResolvedValue(undefined);
    mockTeachers({ availableTeachers: [] });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Vincular Professor'));

    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(
      screen.getByText('Nenhum professor disponível para vínculo.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Fechar modal'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('não desvincula quando a confirmação é negada', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Desvincular Maria'));

    expect(unlinkTeacher).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('não redefine a senha quando a confirmação é negada', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Redefinir senha de Maria'));

    expect(accountService.resetUserPassword).not.toHaveBeenCalled();
  });

  it('mostra erro ao falhar a redefinição de senha', async () => {
    vi.mocked(accountService.resetUserPassword).mockRejectedValue(
      new Error('falha'),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Redefinir senha de Maria'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao redefinir a senha'),
    );
  });

  it('rejeita candidatura na aba de candidaturas', async () => {
    updateEnrollmentStatus.mockResolvedValue(undefined);
    mockTeachers({
      enrollmentRequests: [
        {
          id: 9,
          classId: 10,
          professorId: 7,
          status: 'PENDING',
          createdAt: '2026-10-01',
          user: {
            id: 7,
            name: 'Maria',
            email: 'maria@escola.com',
            subject: { id: 1, name: 'Matemática' },
            totalSubstitutions: 2,
          },
        },
      ],
    });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByText('Candidaturas'));
    fireEvent.click(screen.getByText('Rejeitar'));

    await waitFor(() => {
      expect(updateEnrollmentStatus).toHaveBeenCalledWith(9, 'REJECTED');
      expect(toast.success).toHaveBeenCalledWith('Candidatura rejeitada!');
    });
  });

  it('não mostra ações para candidatura já decidida', () => {
    mockTeachers({
      enrollmentRequests: [
        {
          id: 9,
          classId: 10,
          professorId: 7,
          status: 'APPROVED',
          createdAt: '2026-10-01',
          user: {
            id: 7,
            name: 'Maria',
            email: 'maria@escola.com',
            subject: null,
            totalSubstitutions: 0,
          },
        },
      ],
    });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByText('Candidaturas'));

    expect(screen.getByText('Aprovada')).toBeInTheDocument();
    expect(screen.queryByText('Aprovar')).not.toBeInTheDocument();
    expect(screen.queryByText('Rejeitar')).not.toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
  });

  it('volta a listar todas as candidaturas ao limpar o filtro', () => {
    render(<ProfessoresPage />);
    fireEvent.click(screen.getByText('Candidaturas'));

    fireEvent.change(screen.getByLabelText('Filtrar candidaturas por status'), {
      target: { value: 'PENDING' },
    });
    fireEvent.change(screen.getByLabelText('Filtrar candidaturas por status'), {
      target: { value: '' },
    });

    expect(fetchEnrollmentRequests).toHaveBeenLastCalledWith(undefined);
  });

  it('usa schoolId 0 quando não há escola ativa', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 1, name: 'Master', email: 'm@e.com', profileId: 4 },
      isLoading: false,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: 4,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    } as any);

    render(<ProfessoresPage />);

    expect(useTeachers).toHaveBeenCalledWith(0);
  });

  it('mostra o skeleton nas candidaturas durante o carregamento', () => {
    mockTeachers({ loading: true });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByText('Candidaturas'));

    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });

  it('volta para a aba de professores', () => {
    render(<ProfessoresPage />);

    fireEvent.click(screen.getByText('Candidaturas'));
    fireEvent.click(screen.getByText('Professores'));

    expect(
      screen.getByRole('tab', { name: 'Professores' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Maria')).toBeInTheDocument();
  });

  it('fecha o modal de vínculo ao clicar fora', async () => {
    fetchAvailableTeachers.mockResolvedValue(undefined);
    mockTeachers({ availableTeachers: [] });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Vincular Professor'));

    const modal = await screen.findByRole('dialog');
    fireEvent.click(modal);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra traços quando a candidatura não tem usuário denormalizado', () => {
    mockTeachers({
      enrollmentRequests: [
        {
          id: 12,
          classId: 10,
          professorId: 7,
          status: 'PENDING',
          createdAt: '2026-10-01',
        },
      ],
    });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByText('Candidaturas'));

    const linhas = screen.getAllByRole('row');
    expect(linhas[1]).toHaveTextContent('-');
    expect(linhas[1]).toHaveTextContent('Pendente');
  });

  it('mostra "Sem disciplina" no modal para professor sem disciplina', async () => {
    fetchAvailableTeachers.mockResolvedValue(undefined);
    mockTeachers({
      availableTeachers: [
        {
          id: 13,
          name: 'Caio',
          email: 'caio@escola.com',
          profileId: 3,
          subject: null,
          totalSubstitutions: 0,
        },
      ],
    });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByLabelText('Vincular Professor'));

    await screen.findByRole('dialog');
    expect(screen.getByText(/Sem disciplina/)).toBeInTheDocument();
  });

  it('mostra traço para professor vinculado sem disciplina', () => {
    mockTeachers({
      linkedTeachers: [
        {
          id: 8,
          name: 'João',
          email: 'joao@escola.com',
          profileId: 3,
          subject: null,
          totalSubstitutions: 0,
        },
      ],
    });

    render(<ProfessoresPage />);

    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('mostra o status Rejeitada para candidatura rejeitada', () => {
    mockTeachers({
      enrollmentRequests: [
        {
          id: 14,
          classId: 10,
          professorId: 7,
          status: 'REJECTED',
          createdAt: '2026-10-01',
          user: {
            id: 7,
            name: 'Maria',
            email: 'maria@escola.com',
            subject: { id: 1, name: 'Matemática' },
            totalSubstitutions: 1,
          },
        },
      ],
    });

    render(<ProfessoresPage />);
    fireEvent.click(screen.getByText('Candidaturas'));

    expect(screen.getByText('Rejeitada')).toBeInTheDocument();
  });
});
