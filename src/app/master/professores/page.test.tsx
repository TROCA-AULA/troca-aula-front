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
});
