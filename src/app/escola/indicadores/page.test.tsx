import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { format } from 'date-fns';
import IndicadoresPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useCoverageStats } from '@/hooks/useCoverageStats';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { downloadCsv } from '@/utils/csv';
import { downloadPdfTable } from '@/utils/pdf';

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/hooks/useCoverageStats', () => ({
  useCoverageStats: vi.fn(),
}));

vi.mock('@/hooks/useSubjects', () => ({
  useSubjects: vi.fn(),
}));

vi.mock('@/hooks/useTeachers', () => ({
  useTeachers: vi.fn(),
}));

vi.mock('@/utils/csv', () => ({
  downloadCsv: vi.fn(),
}));

vi.mock('@/utils/pdf', () => ({
  downloadPdfTable: vi.fn(),
}));

const stats = {
  totalVagas: 10,
  cobertas: 8,
  taxaCobertura: 0.8,
  nivel: 'baixo' as const,
};

const enrollmentRequests = [
  {
    id: 1,
    classId: 42,
    professorId: 7,
    status: 'APPROVED' as const,
    createdAt: '2026-09-01T10:00:00Z',
    schoolSince: '2024-02-01T00:00:00Z',
    user: {
      id: 7,
      name: 'Maria Santos',
      email: 'maria@escola.com',
      totalSubstitutions: 3,
    },
  },
];

function mockSchool(activeSchoolId: number | null) {
  vi.mocked(useSchoolContext).mockReturnValue({
    user: { id: 1, name: 'Diretora', email: 'd@e.com', profileId: 1 },
    isLoading: false,
    logout: vi.fn(),
    refreshUserData: vi.fn(),
    schoolLinks: [],
    activeSchoolId,
    activeProfileId: 1,
    activeNetworkId: null,
    setActiveSchoolId: vi.fn(),
  } as any);
}

describe('IndicadoresPage', () => {
  const fetchEnrollmentRequests = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSubjects).mockReturnValue({
      subjects: [{ id: 1, name: 'Matemática' }],
    });
    vi.mocked(useTeachers).mockReturnValue({
      linkedTeachers: [],
      availableTeachers: [],
      enrollmentRequests,
      loading: false,
      error: null,
      fetchLinkedTeachers: vi.fn(),
      fetchAvailableTeachers: vi.fn(),
      fetchEnrollmentRequests,
      linkTeacher: vi.fn(),
      unlinkTeacher: vi.fn(),
      updateEnrollmentStatus: vi.fn(),
    } as any);
  });

  it('mostra o indicador de cobertura com o nível de risco do servidor', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });

    render(<IndicadoresPage />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('baixo')).toBeInTheDocument();
  });

  it('lista substituições aprovadas com o nome do professor', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });

    render(<IndicadoresPage />);

    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(fetchEnrollmentRequests).toHaveBeenCalledWith('APPROVED');
  });

  it('exporta o histórico em CSV', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });

    render(<IndicadoresPage />);

    fireEvent.click(screen.getByText('Exportar CSV'));

    expect(downloadCsv).toHaveBeenCalledWith(
      expect.stringContaining('substituicoes-aprovadas-escola-1-'),
      expect.arrayContaining([
        ['Professor', 'Aula', 'Status', 'Tempo de casa (desde)', 'Candidatura em'],
        expect.arrayContaining(['Maria Santos', '#42', 'APPROVED']),
      ]),
    );
  });

  it('pede para selecionar uma escola quando não há escola ativa', () => {
    mockSchool(null);
    vi.mocked(useCoverageStats).mockReturnValue({ stats: null, loading: false, error: null });

    render(<IndicadoresPage />);

    expect(
      screen.getByText('Selecione uma escola para ver os indicadores.'),
    ).toBeInTheDocument();
  });

  it('mostra o carregando enquanto as estatísticas não chegam', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats: null, loading: true, error: null });

    render(<IndicadoresPage />);

    expect(screen.queryByText('Aulas vagas no recorte')).not.toBeInTheDocument();
  });

  it('mostra o erro da busca de estatísticas', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({
      stats: null,
      loading: false,
      error: 'Erro ao carregar indicadores',
    });

    render(<IndicadoresPage />);

    expect(screen.getByText('Erro ao carregar indicadores')).toBeInTheDocument();
  });

  it('aplica os filtros de disciplina e dia da semana', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });

    render(<IndicadoresPage />);

    fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Dia da semana'), { target: { value: '3' } });

    expect(vi.mocked(useCoverageStats)).toHaveBeenLastCalledWith(1, 1, 3);
  });

  it('limpa os filtros ao voltar para "Todas"/"Todos"', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });

    render(<IndicadoresPage />);

    fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Dia da semana'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Dia da semana'), { target: { value: '' } });

    expect(vi.mocked(useCoverageStats)).toHaveBeenLastCalledWith(1, undefined, undefined);
  });

  it('não mostra os cards quando o servidor não devolve estatísticas', async () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats: null, loading: false, error: null });

    render(<IndicadoresPage />);

    expect(screen.queryByText('Aulas vagas no recorte')).not.toBeInTheDocument();
    expect(screen.getByText('Substituições aprovadas')).toBeInTheDocument();

    // PDF sem estatísticas sai sem subtítulo.
    fireEvent.click(screen.getByText('Exportar PDF'));
    await waitFor(() =>
      expect(downloadPdfTable).toHaveBeenCalledWith(
        expect.stringContaining('indicadores-escola-1-'),
        expect.objectContaining({ subtitle: undefined }),
      ),
    );
  });

  it('exporta o histórico em PDF', async () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });

    render(<IndicadoresPage />);
    fireEvent.click(screen.getByText('Exportar PDF'));

    await waitFor(() =>
      expect(downloadPdfTable).toHaveBeenCalledWith(
        expect.stringContaining('indicadores-escola-1-'),
        expect.objectContaining({
          title: 'Indicadores — Escola #1',
          headers: ['Professor', 'Aula', 'Status', 'Tempo de casa (desde)', 'Candidatura em'],
          rows: expect.arrayContaining([
            [
              'Maria Santos',
              '#42',
              'APPROVED',
              format(new Date('2024-02-01T00:00:00Z'), 'dd/MM/yyyy'),
              format(new Date('2026-09-01T10:00:00Z'), 'dd/MM/yyyy'),
            ],
          ]),
        }),
      ),
    );
  });

  it('imprime a página', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<IndicadoresPage />);
    fireEvent.click(screen.getByText('Imprimir'));

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('usa "Professor #id" e "-" quando faltam dados na candidatura', async () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });
    vi.mocked(useTeachers).mockReturnValue({
      linkedTeachers: [],
      availableTeachers: [],
      enrollmentRequests: [
        {
          id: 9,
          classId: 2,
          professorId: 9,
          status: 'APPROVED' as const,
          createdAt: 'data-invalida',
          schoolSince: null,
        },
      ],
      loading: false,
      error: null,
      fetchLinkedTeachers: vi.fn(),
      fetchAvailableTeachers: vi.fn(),
      fetchEnrollmentRequests,
      linkTeacher: vi.fn(),
      unlinkTeacher: vi.fn(),
      updateEnrollmentStatus: vi.fn(),
    } as any);

    render(<IndicadoresPage />);

    expect(screen.getByText('Professor #9')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2);

    // Exportações usam os mesmos fallbacks.
    fireEvent.click(screen.getByText('Exportar CSV'));
    expect(downloadCsv).toHaveBeenCalledWith(
      expect.stringContaining('substituicoes-aprovadas-escola-1-'),
      expect.arrayContaining([
        expect.arrayContaining(['Professor #9', '#2', 'APPROVED', '-', '-']),
      ]),
    );

    fireEvent.click(screen.getByText('Exportar PDF'));
    await waitFor(() =>
      expect(downloadPdfTable).toHaveBeenCalledWith(
        expect.stringContaining('indicadores-escola-1-'),
        expect.objectContaining({
          rows: expect.arrayContaining([
            ['Professor #9', '#2', 'APPROVED', '-', '-'],
          ]),
        }),
      ),
    );
  });

  it('mostra o carregando do histórico de substituições', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });
    vi.mocked(useTeachers).mockReturnValue({
      linkedTeachers: [],
      availableTeachers: [],
      enrollmentRequests: [],
      loading: true,
      error: null,
      fetchLinkedTeachers: vi.fn(),
      fetchAvailableTeachers: vi.fn(),
      fetchEnrollmentRequests,
      linkTeacher: vi.fn(),
      unlinkTeacher: vi.fn(),
      updateEnrollmentStatus: vi.fn(),
    } as any);

    render(<IndicadoresPage />);

    expect(screen.getAllByRole('status', { name: 'Carregando' })).toHaveLength(1);
  });

  it('mostra os níveis médio e alto do servidor', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({
      stats: { ...stats, nivel: 'medio' as const },
      loading: false,
      error: null,
    });
    const { unmount } = render(<IndicadoresPage />);
    expect(screen.getByText('medio')).toBeInTheDocument();
    unmount();

    vi.mocked(useCoverageStats).mockReturnValue({
      stats: { ...stats, nivel: 'alto' as const },
      loading: false,
      error: null,
    });
    render(<IndicadoresPage />);
    expect(screen.getByText('alto')).toBeInTheDocument();
  });

  it('desabilita as exportações quando não há histórico', () => {
    mockSchool(1);
    vi.mocked(useCoverageStats).mockReturnValue({ stats, loading: false, error: null });
    vi.mocked(useTeachers).mockReturnValue({
      linkedTeachers: [],
      availableTeachers: [],
      enrollmentRequests: [],
      loading: false,
      error: null,
      fetchLinkedTeachers: vi.fn(),
      fetchAvailableTeachers: vi.fn(),
      fetchEnrollmentRequests,
      linkTeacher: vi.fn(),
      unlinkTeacher: vi.fn(),
      updateEnrollmentStatus: vi.fn(),
    } as any);

    render(<IndicadoresPage />);

    expect(screen.getByText('Exportar CSV')).toBeDisabled();
    expect(screen.getByText('Exportar PDF')).toBeDisabled();
  });
});
