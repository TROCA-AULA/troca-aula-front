import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FechamentoPontoPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useMonthlyClosingReports } from '@/hooks/useMonthlyClosingReports';
import { useTeachers } from '@/hooks/useTeachers';
import { downloadPdfTable } from '@/utils/pdf';
import { workloadTypeName } from '@/types/workload';

vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));
vi.mock('@/hooks/useMonthlyClosingReports', () => ({
  useMonthlyClosingReports: vi.fn(),
}));
vi.mock('@/hooks/useTeachers', () => ({ useTeachers: vi.fn() }));
vi.mock('@/utils/pdf', () => ({ downloadPdfTable: vi.fn() }));

const actualWorkload = vi.hoisted(() => ({
  name: undefined as ((id: number) => string) | undefined,
}));
vi.mock('@/types/workload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/types/workload')>();
  actualWorkload.name = actual.workloadTypeName;
  return { ...actual, workloadTypeName: vi.fn(actual.workloadTypeName) };
});

const reviewReport = vi.fn();
const closeReport = vi.fn();
const reopenReport = vi.fn();
const generateReport = vi.fn();

const draftReport = {
  id: 1,
  userId: 7,
  schoolId: 4,
  referenceMonth: '2026-10',
  workloadBreakdown: { SUPLEMENTAR: 6, total: 6 },
  status: 'DRAFT',
  reviewedById: null,
  reviewedAt: null,
  createdAt: '2026-10-01',
};

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

function mockReports(reports: unknown[], loading = false) {
  vi.mocked(useMonthlyClosingReports).mockReturnValue({
    reports,
    loading,
    error: null,
    generateReport,
    reviewReport,
    closeReport,
    reopenReport,
    refetch: vi.fn(),
  } as any);
}

describe('FechamentoPontoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workloadTypeName).mockImplementation((id: number) => actualWorkload.name!(id));
    vi.mocked(useTeachers).mockReturnValue({
      linkedTeachers: [{ id: 7, name: 'Maria', email: 'm@e.com', profileId: 3, totalSubstitutions: 0 }],
      availableTeachers: [],
      enrollmentRequests: [],
      loading: false,
      error: null,
      fetchLinkedTeachers: vi.fn(),
      fetchAvailableTeachers: vi.fn(),
      fetchEnrollmentRequests: vi.fn(),
      linkTeacher: vi.fn(),
      unlinkTeacher: vi.fn(),
      updateEnrollmentStatus: vi.fn(),
    } as any);
  });

  it('pede para selecionar uma escola quando não há escola ativa', () => {
    mockSchool(null);
    mockReports([]);

    render(<FechamentoPontoPage />);

    expect(screen.getByText('Selecione uma escola para continuar.')).toBeInTheDocument();
  });

  it('mostra o card do rascunho com o nome do professor e o breakdown', () => {
    mockSchool(4);
    mockReports([draftReport]);

    render(<FechamentoPontoPage />);

    // "Maria" aparece no select de professor e no card do relatório.
    expect(screen.getAllByText(/Maria/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Revisar')).toBeInTheDocument();
    // Breakdown tem SUPLEMENTAR 6h e total 6h.
    expect(screen.getAllByText('6h').length).toBeGreaterThanOrEqual(1);
  });

  it('revisa um relatório em DRAFT', async () => {
    mockSchool(4);
    mockReports([draftReport]);
    reviewReport.mockResolvedValue({ ...draftReport, status: 'REVIEWED' });

    render(<FechamentoPontoPage />);
    fireEvent.click(screen.getByText('Revisar'));

    await waitFor(() => expect(reviewReport).toHaveBeenCalledWith(1));
  });

  it('fecha um relatório REVIEWED', async () => {
    mockSchool(4);
    mockReports([{ ...draftReport, status: 'REVIEWED' }]);
    closeReport.mockResolvedValue({ ...draftReport, status: 'CLOSED' });

    render(<FechamentoPontoPage />);
    fireEvent.click(screen.getByText('Fechar'));

    await waitFor(() => expect(closeReport).toHaveBeenCalledWith(1));
  });

  it('reabre um relatório CLOSED com justificativa', async () => {
    mockSchool(4);
    mockReports([{ ...draftReport, status: 'CLOSED' }]);
    reopenReport.mockResolvedValue(draftReport);

    render(<FechamentoPontoPage />);
    fireEvent.click(screen.getByText('Reabrir para ajuste'));

    fireEvent.change(screen.getByLabelText(/Motivo da reabertura/), {
      target: { value: 'Horas lançadas em duplicidade' },
    });
    fireEvent.click(screen.getByText('Confirmar reabertura'));

    await waitFor(() =>
      expect(reopenReport).toHaveBeenCalledWith(1, 'Horas lançadas em duplicidade'),
    );
  });

  it('mostra o estado vazio quando não há relatórios', () => {
    mockSchool(4);
    mockReports([]);

    render(<FechamentoPontoPage />);

    expect(screen.getByText('Nenhum relatório gerado ainda.')).toBeInTheDocument();
  });

  it('mostra o carregando enquanto os relatórios não chegam', () => {
    mockSchool(4);
    mockReports([], true);

    render(<FechamentoPontoPage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('gera um relatório novo pelo painel e limpa o formulário', async () => {
    mockSchool(4);
    mockReports([]);
    generateReport.mockResolvedValue(draftReport);

    render(<FechamentoPontoPage />);

    fireEvent.change(screen.getByLabelText('Professor'), { target: { value: '7' } });
    fireEvent.click(screen.getByText('Gerar Relatório'));

    await waitFor(() =>
      expect(generateReport).toHaveBeenCalledWith({
        userId: 7,
        schoolId: 4,
        referenceMonth: new Date().toISOString().slice(0, 7),
      }),
    );
    await waitFor(() =>
      expect((screen.getByLabelText('Professor') as HTMLSelectElement).value).toBe(''),
    );
  });

  it('mostra "Gerando..." enquanto o relatório é criado', async () => {
    mockSchool(4);
    mockReports([]);
    let resolveGenerate: (value: unknown) => void = () => {};
    generateReport.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGenerate = resolve;
        }),
    );

    render(<FechamentoPontoPage />);

    fireEvent.change(screen.getByLabelText('Professor'), { target: { value: '7' } });
    fireEvent.click(screen.getByText('Gerar Relatório'));

    const generating = await screen.findByText('Gerando...');
    expect(generating).toBeDisabled();

    resolveGenerate(draftReport);
    await waitFor(() => expect(screen.getByText('Gerar Relatório')).toBeInTheDocument());
  });

  it('baixa o PDF do relatório com o breakdown', async () => {
    mockSchool(4);
    mockReports([draftReport]);

    render(<FechamentoPontoPage />);

    fireEvent.click(screen.getByText('Baixar PDF'));

    await waitFor(() =>
      expect(downloadPdfTable).toHaveBeenCalledWith(
        'fechamento-2026-10-professor-7.pdf',
        expect.objectContaining({
          title: 'Fechamento de ponto — Maria',
          headers: ['Tipo de carga', 'Horas'],
          rows: expect.arrayContaining([
            ['Total', '6h'],
            [expect.stringContaining('Tipo #'), '6h'],
          ]),
        }),
      ),
    );
  });

  it('ordena os relatórios do mês mais recente para o mais antigo', () => {
    mockSchool(4);
    mockReports([
      { ...draftReport, id: 1, referenceMonth: '2026-08' },
      { ...draftReport, id: 2, referenceMonth: '2026-10' },
      { ...draftReport, id: 3, referenceMonth: '2026-09' },
    ]);

    render(<FechamentoPontoPage />);

    const headers = screen.getAllByText(/— \d{4}-\d{2}/);
    expect(headers.map((element) => element.textContent)).toEqual([
      'Maria — 2026-10',
      'Maria — 2026-09',
      'Maria — 2026-08',
    ]);
  });

  it('usa "Professor #id" quando o professor não está na lista de vinculados', () => {
    mockSchool(4);
    mockReports([{ ...draftReport, userId: 99 }]);

    render(<FechamentoPontoPage />);

    expect(screen.getByText('Professor #99')).toBeInTheDocument();
  });

  it('lida com relatório sem breakdown de cargas', () => {
    mockSchool(4);
    mockReports([{ ...draftReport, workloadBreakdown: undefined }]);

    render(<FechamentoPontoPage />);

    expect(screen.getByText('Revisar')).toBeInTheDocument();
  });

  it('usa a chave crua quando o tipo de carga não tem nome amigável', async () => {
    vi.mocked(workloadTypeName).mockImplementation(() => '');
    mockSchool(4);
    mockReports([draftReport]);

    render(<FechamentoPontoPage />);

    expect(screen.getByText('SUPLEMENTAR')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Baixar PDF'));

    await waitFor(() =>
      expect(downloadPdfTable).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          rows: expect.arrayContaining([['SUPLEMENTAR', '6h']]),
        }),
      ),
    );
  });

  it('exige justificativa com pelo menos 10 caracteres para reabrir', async () => {
    mockSchool(4);
    mockReports([{ ...draftReport, status: 'CLOSED' }]);

    render(<FechamentoPontoPage />);
    fireEvent.click(screen.getByText('Reabrir para ajuste'));
    fireEvent.change(screen.getByLabelText(/Motivo da reabertura/), {
      target: { value: 'curto' },
    });
    fireEvent.click(screen.getByText('Confirmar reabertura'));

    expect(
      await screen.findByText('Descreva o motivo com pelo menos 10 caracteres.'),
    ).toBeInTheDocument();
    expect(reopenReport).not.toHaveBeenCalled();
  });

  it('cancela a reabertura e fecha o painel', () => {
    mockSchool(4);
    mockReports([{ ...draftReport, status: 'CLOSED' }]);

    render(<FechamentoPontoPage />);
    fireEvent.click(screen.getByText('Reabrir para ajuste'));
    fireEvent.change(screen.getByLabelText(/Motivo da reabertura/), {
      target: { value: 'motivo suficientemente longo' },
    });
    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByLabelText(/Motivo da reabertura/)).not.toBeInTheDocument();
    expect(reopenReport).not.toHaveBeenCalled();
  });
});
