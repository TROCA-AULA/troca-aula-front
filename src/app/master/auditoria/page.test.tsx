import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuditoriaPage from './page';
import { useNetworks } from '@/hooks/useNetworks';
import { useAuditLog } from '@/hooks/useAuditLog';

vi.mock('@/hooks/useNetworks', () => ({
  useNetworks: vi.fn(),
}));

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditLog: vi.fn(),
}));

// A página usa o activeNetworkId do SchoolContext para já abrir na rede da
// escola ativa; neste teste o contexto é mockado sem rede ativa, então a
// seleção continua manual (comportamento dos casos abaixo).
vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(() => ({ activeNetworkId: null })),
}));

describe('AuditoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
