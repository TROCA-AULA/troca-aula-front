import { render, screen, fireEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RedesPage from './page';
import { useNetworks } from '@/hooks/useNetworks';
import { useInterconnections } from '@/hooks/useEligibility';

vi.mock('@/hooks/useNetworks', () => ({
  useNetworks: vi.fn(),
}));

vi.mock('@/hooks/useEligibility', () => ({
  useInterconnections: vi.fn(),
}));

// O NetworkForm chama outros hooks de rede; o teste focado aqui é a lista e
// a abertura do modal de interconexões.
vi.mock('./components/NetworkForm', () => ({
  NetworkForm: () => null,
}));

describe('RedesPage', () => {
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
    vi.mocked(useInterconnections).mockReturnValue({
      data: { networkId: 1, interconnections: [{ networkId: 2, networkName: 'Rede B' }] },
      loading: false,
      save: vi.fn(),
    });
  });

  it('lista as redes com ações', () => {
    render(<RedesPage />);

    expect(screen.getByText('Rede A')).toBeInTheDocument();
    expect(screen.getByText('Rede B')).toBeInTheDocument();
    expect(screen.getAllByText('Editar')).toHaveLength(2);
    expect(screen.getAllByText('Interconexões')).toHaveLength(2);
  });

  it('abre o modal de interconexões da rede', () => {
    render(<RedesPage />);

    fireEvent.click(screen.getAllByText('Interconexões')[0]);

    expect(screen.getByText('Interconexões de Rede A')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('mostra o estado de carregamento', () => {
    vi.mocked(useNetworks).mockReturnValue({
      networks: [],
      loading: true,
      error: null,
      createNetwork: vi.fn(),
      updateNetwork: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<RedesPage />);

    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });
});
