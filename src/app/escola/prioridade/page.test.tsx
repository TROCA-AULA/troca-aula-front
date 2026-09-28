import { render, screen, fireEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PrioridadePage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useNetworks } from '@/hooks/useNetworks';
import { usePriorityTiers } from '@/hooks/useEligibility';

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/hooks/useNetworks', () => ({
  useNetworks: vi.fn(),
}));

vi.mock('@/hooks/useEligibility', () => ({
  usePriorityTiers: vi.fn(),
}));

const save = vi.fn();

describe('PrioridadePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 1, name: 'Diretora', email: 'd@e.com', profileId: 1 },
      isLoading: false,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: 4,
      activeProfileId: 1,
      activeNetworkId: 2,
      setActiveSchoolId: vi.fn(),
    } as any);
    vi.mocked(useNetworks).mockReturnValue({
      networks: [
        { id: 3, name: 'Rede Vizinha', createdAt: '2026-01-01' },
      ],
      loading: false,
      error: null,
      createNetwork: vi.fn(),
      updateNetwork: vi.fn(),
      refetch: vi.fn(),
    } as any);
    vi.mocked(usePriorityTiers).mockReturnValue({
      data: {
        schoolId: 4,
        fallbackPriorityWindowHours: null,
        allowedNetworkIds: [3],
        tiers: [
          { order: 1, delayMinutes: 0, scopeType: 'ESCOLA', restrictedNetworkIds: null },
          { order: 2, delayMinutes: 30, scopeType: 'GERAL', restrictedNetworkIds: null },
        ],
      },
      loading: false,
      save,
      refetch: vi.fn(),
    } as any);
  });

  it('mostra os níveis atuais e as redes interconectadas permitidas', () => {
    render(<PrioridadePage />);

    expect(screen.getByText(/Rede Vizinha/)).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
  });

  it('adiciona um nível novo e salva na ordem correta', async () => {
    render(<PrioridadePage />);

    fireEvent.click(screen.getByText('Adicionar nível'));
    expect(screen.getAllByRole('combobox')).toHaveLength(3);

    fireEvent.click(screen.getByText('Salvar níveis'));

    expect(save).toHaveBeenCalledWith([
      expect.objectContaining({ order: 1, scopeType: 'ESCOLA' }),
      expect.objectContaining({ order: 2, scopeType: 'GERAL', delayMinutes: 30 }),
      expect.objectContaining({ order: 3, scopeType: 'GERAL' }),
    ]);
  });

  it('remove um nível e renumerara', () => {
    render(<PrioridadePage />);

    fireEvent.click(screen.getAllByLabelText('Remover nível')[0]);

    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    fireEvent.click(screen.getByText('Salvar níveis'));
    expect(save).toHaveBeenCalledWith([
      expect.objectContaining({ order: 1, scopeType: 'GERAL' }),
    ]);
  });
});
