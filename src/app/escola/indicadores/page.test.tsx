import { render, screen, fireEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IndicadoresPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useCoverageStats } from '@/hooks/useCoverageStats';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { downloadCsv } from '@/utils/csv';

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
});
