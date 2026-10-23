import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import ProfessoresEscolaPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { teacherService } from '@/services/teacher.service';
import { accountService } from '@/services/account.service';

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));
vi.mock('@/hooks/useTeachers', () => ({ useTeachers: vi.fn() }));
vi.mock('@/hooks/useSubjects', () => ({ useSubjects: vi.fn() }));
vi.mock('@/services/teacher.service', () => ({
  teacherService: {
    findByEmail: vi.fn(),
    linkTeacher: vi.fn(),
    unlinkTeacher: vi.fn(),
    updateTeacher: vi.fn(),
  },
}));
vi.mock('@/services/account.service', () => ({
  accountService: { resetUserPassword: vi.fn() },
}));

const fetchLinkedTeachers = vi.fn();

const ana = {
  id: 7,
  name: 'Ana',
  email: 'ana@x.com',
  profileId: 3,
  subjectId: 1,
  substitutionLimitPerSemester: 5,
  totalSubstitutions: 0,
};
const bruno = {
  id: 8,
  name: 'Bruno',
  email: 'bruno@x.com',
  profileId: 3,
  subjectId: null,
  substitutionLimitPerSemester: null,
  totalSubstitutions: 0,
};

function mockPage({
  schoolId = 10 as number | null,
  teachers = [ana, bruno] as unknown[],
  loading = false,
} = {}) {
  vi.mocked(useSchoolContext).mockReturnValue({ activeSchoolId: schoolId } as any);
  vi.mocked(useTeachers).mockReturnValue({
    linkedTeachers: teachers,
    loading,
    fetchLinkedTeachers,
  } as any);
  vi.mocked(useSubjects).mockReturnValue({
    subjects: [
      { id: 1, name: 'Matemática' },
      { id: 2, name: 'História' },
    ],
  });
}

describe('ProfessoresEscolaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage();
  });

  it('pede para escolher uma escola quando não há escola ativa', () => {
    mockPage({ schoolId: null });
    render(<ProfessoresEscolaPage />);

    expect(
      screen.getByText('Selecione uma escola para gerenciar os professores.'),
    ).toBeInTheDocument();
  });

  it('mostra estado vazio e carregando', () => {
    mockPage({ teachers: [] });
    const { unmount } = render(<ProfessoresEscolaPage />);
    expect(
      screen.getByText('Nenhum professor vinculado a esta escola ainda.'),
    ).toBeInTheDocument();
    unmount();

    mockPage({ loading: true });
    render(<ProfessoresEscolaPage />);
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
  });

  it('lista os professores com disciplina e limite, avisando quem não tem disciplina', () => {
    render(<ProfessoresEscolaPage />);

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByLabelText('Disciplina de Ana')).toHaveValue('1');
    expect(screen.getByLabelText('Limite de Ana')).toHaveValue(5);
    expect(screen.getByLabelText('Disciplina de Bruno')).toHaveValue('');
    expect(screen.getByLabelText('Limite de Bruno')).toHaveValue(null);
    expect(screen.getByText('Não vê vagas até ter disciplina')).toBeInTheDocument();
  });

  it('busca por e-mail e vincula como professor', async () => {
    vi.mocked(teacherService.findByEmail).mockResolvedValue({
      id: 20,
      name: 'Carla',
      email: 'carla@x.com',
      subjectId: 2,
    });
    vi.mocked(teacherService.linkTeacher).mockResolvedValue();
    render(<ProfessoresEscolaPage />);

    fireEvent.change(screen.getByLabelText('E-mail do professor'), {
      target: { value: 'carla@x.com' },
    });
    fireEvent.click(screen.getByText('Buscar'));

    await screen.findByText('Carla');
    expect(screen.getByText('Disciplina: História')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Vincular como professor'));

    await waitFor(() =>
      expect(teacherService.linkTeacher).toHaveBeenCalledWith(20, 10),
    );
    expect(fetchLinkedTeachers).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Carla agora é professor desta escola',
    );
  });

  it('avisa quando o e-mail não tem cadastro ou já é da escola', async () => {
    vi.mocked(teacherService.findByEmail).mockResolvedValueOnce(null);
    render(<ProfessoresEscolaPage />);

    fireEvent.change(screen.getByLabelText('E-mail do professor'), {
      target: { value: 'ninguem@x.com' },
    });
    fireEvent.click(screen.getByText('Buscar'));
    await screen.findByText(/Nenhum cadastro com esse e-mail/);

    vi.mocked(teacherService.findByEmail).mockResolvedValueOnce({
      id: 7,
      name: 'Ana',
      email: 'ana@x.com',
      subjectId: null,
    });
    fireEvent.click(screen.getByText('Buscar'));
    await screen.findByText('Já é professor desta escola.');
    expect(screen.getByText('Disciplina: não informada')).toBeInTheDocument();
  });

  it('trata erro na busca como "não encontrado"', async () => {
    vi.mocked(teacherService.findByEmail).mockRejectedValue(new Error('403'));
    render(<ProfessoresEscolaPage />);

    fireEvent.change(screen.getByLabelText('E-mail do professor'), {
      target: { value: 'x@x.com' },
    });
    fireEvent.click(screen.getByText('Buscar'));

    await screen.findByText(/Nenhum cadastro com esse e-mail/);
  });

  it('não busca com e-mail em branco', () => {
    render(<ProfessoresEscolaPage />);
    fireEvent.submit(screen.getByLabelText('E-mail do professor').closest('form')!);
    expect(teacherService.findByEmail).not.toHaveBeenCalled();
  });

  it('salva disciplina e limite (D6/D9)', async () => {
    vi.mocked(teacherService.updateTeacher).mockResolvedValue();
    render(<ProfessoresEscolaPage />);

    fireEvent.change(screen.getByLabelText('Disciplina de Bruno'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Limite de Bruno'), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByLabelText('Salvar Bruno'));

    await waitFor(() =>
      expect(teacherService.updateTeacher).toHaveBeenCalledWith(8, {
        subjectId: 2,
        substitutionLimitPerSemester: 3,
      }),
    );
    expect(fetchLinkedTeachers).toHaveBeenCalled();
  });

  it('limite em branco salva como "sem limite"; inválido é recusado', async () => {
    vi.mocked(teacherService.updateTeacher).mockResolvedValue();
    render(<ProfessoresEscolaPage />);

    fireEvent.change(screen.getByLabelText('Limite de Ana'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByLabelText('Salvar Ana'));
    await waitFor(() =>
      expect(teacherService.updateTeacher).toHaveBeenCalledWith(7, {
        subjectId: 1,
        substitutionLimitPerSemester: null,
      }),
    );

    vi.mocked(teacherService.updateTeacher).mockClear();
    fireEvent.change(screen.getByLabelText('Limite de Ana'), {
      target: { value: '-2' },
    });
    fireEvent.click(screen.getByLabelText('Salvar Ana'));
    expect(toast.error).toHaveBeenCalled();
    expect(teacherService.updateTeacher).not.toHaveBeenCalled();
  });

  it('não quebra quando o backend recusa a alteração', async () => {
    vi.mocked(teacherService.updateTeacher).mockRejectedValue(new Error('403'));
    render(<ProfessoresEscolaPage />);

    fireEvent.click(screen.getByLabelText('Salvar Ana'));

    await waitFor(() => expect(teacherService.updateTeacher).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('redefine a senha e avisa que foi por e-mail', async () => {
    vi.mocked(accountService.resetUserPassword).mockResolvedValue({
      tempPassword: 'Tmp12345',
      emailSent: true,
    });
    render(<ProfessoresEscolaPage />);

    fireEvent.click(screen.getByLabelText('Redefinir senha de Ana'));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'A senha temporária foi enviada para o e-mail de Ana. Se não chegar, repasse: Tmp12345',
        { autoClose: false },
      ),
    );
  });

  it('desvincula após confirmar, e cancelar não faz nada', async () => {
    vi.mocked(teacherService.unlinkTeacher).mockResolvedValue();
    render(<ProfessoresEscolaPage />);

    fireEvent.click(screen.getByLabelText('Desvincular Ana'));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(teacherService.unlinkTeacher).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Desvincular Ana'));
    fireEvent.click(screen.getByRole('button', { name: 'Desvincular' }));

    await waitFor(() =>
      expect(teacherService.unlinkTeacher).toHaveBeenCalledWith(7, 10),
    );
    expect(toast.success).toHaveBeenCalledWith('Ana foi desvinculado da escola');
  });
});
