import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchoolForm } from './SchoolForm';
import { useSchools } from '@/hooks/useSchools';
import { useNetworks } from '@/hooks/useNetworks';
import type { School } from '@/types/master';

vi.mock('@/hooks/useSchools', () => ({ useSchools: vi.fn() }));
vi.mock('@/hooks/useNetworks', () => ({ useNetworks: vi.fn() }));

const createSchool = vi.fn();
const updateSchool = vi.fn();
const updatePriorityWindow = vi.fn();

const networks = [
  { id: 1, name: 'Rede A', createdAt: '2026-01-01' },
  { id: 2, name: 'Rede B', createdAt: '2026-01-02' },
];

const escola: School = {
  id: 10,
  name: 'Escola A',
  networkId: 1,
  substitutionLimitPerSemester: null,
  priorityWindowHours: 4,
  createdAt: '2026-01-01',
};

function mockHooks(networksLoading = false) {
  vi.mocked(useSchools).mockReturnValue({
    schools: [],
    loading: false,
    error: null,
    createSchool,
    updateSchool,
    updatePriorityWindow,
    deleteSchool: vi.fn(),
    refetch: vi.fn(),
  } as any);
  vi.mocked(useNetworks).mockReturnValue({
    networks,
    loading: networksLoading,
    error: null,
    createNetwork: vi.fn(),
    updateNetwork: vi.fn(),
    refetch: vi.fn(),
  } as any);
}

describe('SchoolForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHooks();
  });

  it('não renderiza nada quando fechado', () => {
    const { container } = render(
      <SchoolForm open={false} mode="create" onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza em modo de criação, sem o campo de janela de prioridade', () => {
    render(<SchoolForm open mode="create" onClose={vi.fn()} />);

    expect(screen.getByText('Nova Escola')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome *')).toHaveValue('');
    expect(screen.getByLabelText('Rede de Ensino *')).toHaveValue('');
    expect(screen.getByText('Rede A')).toBeInTheDocument();
    expect(screen.getByText('Rede B')).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/janela de prioridade/i),
    ).not.toBeInTheDocument();
  });

  it('renderiza em modo de edição com os dados iniciais', () => {
    render(
      <SchoolForm open mode="edit" initialData={escola} onClose={vi.fn()} />,
    );

    expect(screen.getByText('Editar Escola')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome *')).toHaveValue('Escola A');
    expect(screen.getByLabelText('Rede de Ensino *')).toHaveValue('1');
    expect(screen.getByLabelText(/janela de prioridade/i)).toHaveValue(4);
  });

  it('desabilita o select de redes enquanto elas carregam', () => {
    mockHooks(true);

    render(<SchoolForm open mode="create" onClose={vi.fn()} />);

    expect(screen.getByLabelText('Rede de Ensino *')).toBeDisabled();
  });

  it('valida o nome antes de criar', async () => {
    render(<SchoolForm open mode="create" onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(
        screen.getByText('Nome é obrigatório e deve ter no mínimo 2 caracteres'),
      ).toBeInTheDocument(),
    );
    expect(createSchool).not.toHaveBeenCalled();
  });

  it('valida a rede obrigatória antes de criar', async () => {
    render(<SchoolForm open mode="create" onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Escola Nova' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(screen.getByText('Selecione uma rede')).toBeInTheDocument(),
    );
    expect(createSchool).not.toHaveBeenCalled();
  });

  it('cria a escola com os dados preenchidos', async () => {
    createSchool.mockResolvedValue({ id: 1 });
    const onClose = vi.fn();

    render(<SchoolForm open mode="create" onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Escola Nova' },
    });
    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(createSchool).toHaveBeenCalledWith({
        name: 'Escola Nova',
        networkId: 2,
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(updateSchool).not.toHaveBeenCalled();
  });

  it('mostra "Salvando..." e desabilita o botão durante o envio', async () => {
    let resolveCreate: (value: unknown) => void = () => {};
    createSchool.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    render(<SchoolForm open mode="create" onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Escola Nova' },
    });
    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    const botaoSalvando = await screen.findByRole('button', {
      name: 'Salvando...',
    });
    expect(botaoSalvando).toBeDisabled();

    resolveCreate({ id: 1 });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled(),
    );
  });

  it('edita a escola e atualiza a janela quando o valor muda', async () => {
    updateSchool.mockResolvedValue({});
    updatePriorityWindow.mockResolvedValue({});
    const onClose = vi.fn();

    render(
      <SchoolForm open mode="edit" initialData={escola} onClose={onClose} />,
    );

    fireEvent.change(screen.getByLabelText(/janela de prioridade/i), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(updateSchool).toHaveBeenCalledWith(10, {
        name: 'Escola A',
        networkId: 1,
      });
      expect(updatePriorityWindow).toHaveBeenCalledWith(10, 8);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('não atualiza a janela quando o valor não mudou', async () => {
    updateSchool.mockResolvedValue({});

    render(
      <SchoolForm open mode="edit" initialData={escola} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(updateSchool).toHaveBeenCalled());
    expect(updatePriorityWindow).not.toHaveBeenCalled();
  });

  it('remove a janela quando o campo é apagado', async () => {
    updateSchool.mockResolvedValue({});
    updatePriorityWindow.mockResolvedValue({});

    render(
      <SchoolForm open mode="edit" initialData={escola} onClose={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText(/janela de prioridade/i), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(updatePriorityWindow).toHaveBeenCalledWith(10, null),
    );
  });

  it('em modo de edição sem dados iniciais apenas fecha o modal', async () => {
    const onClose = vi.fn();

    render(
      <SchoolForm open mode="edit" initialData={null} onClose={onClose} />,
    );

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Escola Nova' },
    });
    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(updateSchool).not.toHaveBeenCalled();
  });

  it('fecha ao clicar em Cancelar, fora do modal, e não fecha ao clicar dentro', () => {
    const onClose = vi.fn();

    render(<SchoolForm open mode="create" onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nova Escola'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByText('Nova Escola').parentElement!.parentElement!,
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
