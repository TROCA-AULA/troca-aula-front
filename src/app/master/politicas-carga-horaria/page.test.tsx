import { render, screen, fireEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PoliticasPage from './page';
import { useWorkloadPolicies } from '@/hooks/useWorkloadPolicies';
import { useNetworks } from '@/hooks/useNetworks';

vi.mock('@/hooks/useWorkloadPolicies', () => ({ useWorkloadPolicies: vi.fn() }));
vi.mock('@/hooks/useNetworks', () => ({ useNetworks: vi.fn() }));
vi.mock('./components/WorkloadPolicyForm', () => ({
  WorkloadPolicyForm: ({ open }: { open: boolean }) =>
    open ? <div>form-politica</div> : null,
}));

describe('PoliticasCargaHorariaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNetworks).mockReturnValue({
      networks: [{ id: 1, name: 'Rede Padrão', createdAt: '2026-01-01' }],
      loading: false,
      error: null,
      createNetwork: vi.fn(),
      updateNetwork: vi.fn(),
      refetch: vi.fn(),
    } as any);
    vi.mocked(useWorkloadPolicies).mockReturnValue({
      policies: [
        {
          id: 1,
          networkId: 1,
          workloadTypeId: 1,
          maxHoursPerWeek: 20,
          ataOficialRequired: true,
        },
      ],
      loading: false,
      error: null,
      createPolicy: vi.fn(),
      updatePolicy: vi.fn(),
      refetch: vi.fn(),
    } as any);
  });

  it('lista as políticas com tipo de carga e limite', () => {
    render(<PoliticasPage />);

    // "Rede Padrão" aparece no select e na linha da tabela.
    expect(screen.getAllByText('Rede Padrão').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há políticas', () => {
    vi.mocked(useWorkloadPolicies).mockReturnValue({
      policies: [],
      loading: false,
      error: null,
      createPolicy: vi.fn(),
      updatePolicy: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<PoliticasPage />);

    expect(screen.getByText(/Nenhuma política cadastrada/)).toBeInTheDocument();
  });

  it('abre o formulário ao criar e ao editar', () => {
    render(<PoliticasPage />);

    fireEvent.click(screen.getByText('+ Nova Política'));
    expect(screen.getByText('form-politica')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Editar'));
    expect(screen.getByText('form-politica')).toBeInTheDocument();
  });
});
