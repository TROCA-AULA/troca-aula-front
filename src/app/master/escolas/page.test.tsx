import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EscolasPage from './page';
import { useSchools } from '@/hooks/useSchools';
import { useNetworks } from '@/hooks/useNetworks';

vi.mock('@/hooks/useSchools', () => ({ useSchools: vi.fn() }));
vi.mock('@/hooks/useNetworks', () => ({ useNetworks: vi.fn() }));
vi.mock('./components/SchoolForm', () => ({
  SchoolForm: ({ open }: { open: boolean }) =>
    open ? <div>form-escola</div> : null,
}));

const deleteSchool = vi.fn();

describe('EscolasPage', () => {
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
    vi.mocked(useSchools).mockReturnValue({
      schools: [
        {
          id: 10,
          name: 'Escola A',
          networkId: 1,
          createdAt: '2026-01-01',
        },
      ],
      loading: false,
      error: null,
      createSchool: vi.fn(),
      updateSchool: vi.fn(),
      updatePriorityWindow: vi.fn(),
      deleteSchool,
      refetch: vi.fn(),
    } as any);
  });

  it('lista escolas com a rede resolvida', () => {
    render(<EscolasPage />);

    expect(screen.getByText('Escola A')).toBeInTheDocument();
    expect(screen.getByText('Rede Padrão')).toBeInTheDocument();
  });

  it('abre formulário ao criar e ao editar', () => {
    render(<EscolasPage />);

    fireEvent.click(screen.getByText('+ Nova Escola'));
    expect(screen.getByText('form-escola')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Editar'));
    expect(screen.getByText('form-escola')).toBeInTheDocument();
  });

  it('exclui a escola após confirmação', async () => {
    deleteSchool.mockResolvedValue(undefined);
    render(<EscolasPage />);

    fireEvent.click(screen.getByText('Excluir'));
    fireEvent.click(screen.getByText('Confirmar'));

    await waitFor(() => expect(deleteSchool).toHaveBeenCalledWith(10));
  });

  it('mostra o estado de carregamento', () => {
    vi.mocked(useSchools).mockReturnValue({
      schools: [],
      loading: true,
      error: null,
      createSchool: vi.fn(),
      updateSchool: vi.fn(),
      updatePriorityWindow: vi.fn(),
      deleteSchool,
      refetch: vi.fn(),
    } as any);

    render(<EscolasPage />);

    // P13: estado de carregamento agora é skeleton (não mais texto).
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });
});
