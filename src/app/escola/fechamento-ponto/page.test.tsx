import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FechamentoPontoPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useMonthlyClosingReports } from '@/hooks/useMonthlyClosingReports';
import { useTeachers } from '@/hooks/useTeachers';

vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));
vi.mock('@/hooks/useMonthlyClosingReports', () => ({
  useMonthlyClosingReports: vi.fn(),
}));
vi.mock('@/hooks/useTeachers', () => ({ useTeachers: vi.fn() }));

const reviewReport = vi.fn();
const closeReport = vi.fn();
const reopenReport = vi.fn();

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

function mockReports(reports: unknown[]) {
  vi.mocked(useMonthlyClosingReports).mockReturnValue({
    reports,
    loading: false,
    error: null,
    generateReport: vi.fn(),
    reviewReport,
    closeReport,
    reopenReport,
    refetch: vi.fn(),
  } as any);
}

describe('FechamentoPontoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
