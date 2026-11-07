import { render, screen } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from './page';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';

vi.mock('@/hooks/useMasterDashboard', () => ({
  useMasterDashboard: vi.fn(),
}));

describe('Master DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra os cards de estatísticas', () => {
    vi.mocked(useMasterDashboard).mockReturnValue({
      stats: {
        totalSchools: 3,
        totalClassesAvailable: 5,
        totalSubstitutionsThisMonth: 12,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Total de Escolas')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Aulas Vagas')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Substituições este mês')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('mostra o estado de carregamento', () => {
    vi.mocked(useMasterDashboard).mockReturnValue({
      stats: { totalSchools: 0, totalClassesAvailable: 0, totalSubstitutionsThisMonth: 0 },
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    // P13: estado de carregamento agora é skeleton (não mais texto).
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });

  it('mostra o erro quando a busca falha', () => {
    vi.mocked(useMasterDashboard).mockReturnValue({
      stats: { totalSchools: 0, totalClassesAvailable: 0, totalSubstitutionsThisMonth: 0 },
      loading: false,
      error: 'Erro ao carregar estatísticas',
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Erro ao carregar estatísticas')).toBeInTheDocument();
  });
});
