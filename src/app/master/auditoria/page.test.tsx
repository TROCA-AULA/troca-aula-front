import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuditoriaPage from './page';
import { useNetworks } from '@/hooks/useNetworks';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useSchoolContext } from '@/contexts/SchoolContext';

vi.mock('@/hooks/useNetworks', () => ({
  useNetworks: vi.fn(),
}));

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditLog: vi.fn(),
}));

// A página usa o activeNetworkId do SchoolContext para já abrir na rede da
// escola ativa; na maioria dos testes o contexto é mockado sem rede ativa,
// então a seleção continua manual.
vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(() => ({ activeNetworkId: null })),
}));

describe('AuditoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSchoolContext).mockReturnValue({
      activeNetworkId: null,
    } as any);
    vi.mocked(useNetworks).mockReturnValue({
      networks: [
        { id: 1, name: 'Rede A', createdAt: '2026-01-01' },
        { id: 2, name: 'Rede B', createdAt: '2026-01-02' },
      ],
      loading: false,
      error: null,
      createNetwork: vi.fn(),
      updateNetwork: vi.fn(),
      refetch: vi.fn(),
    } as any);
  });

  it('should prompt to select a network before showing any entries', () => {
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);

    expect(
      screen.getByText('Selecione uma rede para ver o histórico de alterações.'),
    ).toBeInTheDocument();
  });

  it('should list entries with the resolved changedByName once a network is selected', async () => {
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [
        {
          id: 1,
          networkId: 1,
          entityType: 'TeacherWorkloadRecords',
          entityId: 10,
          changedById: 5,
          changedByName: 'Diretora Ana',
          changedByEmail: 'diretora@escola.com',
          before: null,
          after: { hours: 6 },
          justification: 'Ajuste de carga',
          changedAt: '2026-10-01T10:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);

    fireEvent.change(screen.getByLabelText(/rede/i), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText(/TeacherWorkloadRecords #10/)).toBeInTheDocument();
      expect(screen.getByText('Diretora Ana')).toBeInTheDocument();
    });
  });

  it('should fall back to a numeric label when changedByName is unavailable', async () => {
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [
        {
          id: 2,
          networkId: 1,
          entityType: 'TeacherWorkloadRecords',
          entityId: 11,
          changedById: 9,
          changedByName: null,
          changedByEmail: null,
          before: null,
          after: null,
          justification: null,
          changedAt: '2026-10-01T10:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);
    fireEvent.change(screen.getByLabelText(/rede/i), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Usuário #9')).toBeInTheDocument();
    });
  });

  it('should show an empty state when the selected network has no entries', async () => {
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);
    fireEvent.change(screen.getByLabelText(/rede/i), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText(/nenhuma alteração registrada/i)).toBeInTheDocument();
    });
  });

  it('should auto-select the active network when it is available', async () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      activeNetworkId: 2,
    } as any);
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [
        {
          id: 3,
          networkId: 2,
          entityType: 'TeacherWorkloadRecords',
          entityId: 20,
          changedById: 5,
          changedByName: 'Diretora Ana',
          changedByEmail: null,
          before: null,
          after: null,
          justification: null,
          changedAt: '2026-10-01T10:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/rede/i)).toHaveValue('2');
      expect(useAuditLog).toHaveBeenCalledWith(2);
    });
    expect(screen.getByText(/TeacherWorkloadRecords #20/)).toBeInTheDocument();
  });

  it('should keep the manual selection when the active network is unavailable', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      activeNetworkId: 99,
    } as any);
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);

    expect(screen.getByLabelText(/rede/i)).toHaveValue('');
    expect(
      screen.getByText('Selecione uma rede para ver o histórico de alterações.'),
    ).toBeInTheDocument();
  });

  it('should disable the network select while networks are loading', () => {
    vi.mocked(useNetworks).mockReturnValue({
      networks: [],
      loading: true,
      error: null,
      createNetwork: vi.fn(),
      updateNetwork: vi.fn(),
      refetch: vi.fn(),
    } as any);
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);

    expect(screen.getByLabelText(/rede/i)).toBeDisabled();
  });

  it('should show the loading skeleton for a selected network', () => {
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);
    fireEvent.change(screen.getByLabelText(/rede/i), { target: { value: '1' } });

    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });

  it('should expand and collapse entry details, including the justification', () => {
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [
        {
          id: 4,
          networkId: 1,
          entityType: 'TeacherWorkloadRecords',
          entityId: 12,
          changedById: 5,
          changedByName: 'Diretora Ana',
          changedByEmail: null,
          before: null,
          after: { hours: 6 },
          justification: 'Ajuste de carga',
          changedAt: '2026-10-01T10:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);
    fireEvent.change(screen.getByLabelText(/rede/i), { target: { value: '1' } });

    fireEvent.click(screen.getByText('ver detalhes'));

    expect(screen.getByText('ocultar')).toBeInTheDocument();
    expect(screen.getByText(/Justificativa: Ajuste de carga/)).toBeInTheDocument();
    expect(screen.getByText(/"after"/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('ocultar'));

    expect(screen.getByText('ver detalhes')).toBeInTheDocument();
    expect(screen.queryByText(/Justificativa: Ajuste de carga/)).not.toBeInTheDocument();
  });

  it('should show details without the justification prefix when absent', () => {
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [
        {
          id: 5,
          networkId: 1,
          entityType: 'TeacherWorkloadRecords',
          entityId: 13,
          changedById: 5,
          changedByName: 'Diretora Ana',
          changedByEmail: null,
          before: { hours: 4 },
          after: { hours: 5 },
          justification: null,
          changedAt: '2026-10-01T10:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);
    fireEvent.change(screen.getByLabelText(/rede/i), { target: { value: '1' } });
    fireEvent.click(screen.getByText('ver detalhes'));

    expect(screen.getByText(/"after"/)).toBeInTheDocument();
    expect(screen.queryByText(/Justificativa:/)).not.toBeInTheDocument();
  });

  it('should clear the selection and return to the prompt', () => {
    vi.mocked(useAuditLog).mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditoriaPage />);
    fireEvent.change(screen.getByLabelText(/rede/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/rede/i), { target: { value: '' } });

    expect(
      screen.getByText('Selecione uma rede para ver o histórico de alterações.'),
    ).toBeInTheDocument();
  });
});
