import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkForm } from './NetworkForm';
import { useNetworks } from '@/hooks/useNetworks';
import type { Network } from '@/types/master';

vi.mock('@/hooks/useNetworks', () => ({ useNetworks: vi.fn() }));

const createNetwork = vi.fn();
const updateNetwork = vi.fn();

const rede: Network = { id: 5, name: 'Rede A', createdAt: '2026-01-01' };

function mockHook() {
  vi.mocked(useNetworks).mockReturnValue({
    networks: [rede],
    loading: false,
    error: null,
    createNetwork,
    updateNetwork,
    refetch: vi.fn(),
  } as any);
}

describe('NetworkForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook();
  });

  it('não renderiza nada quando fechado', () => {
    const { container } = render(
      <NetworkForm open={false} mode="create" onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza em modo de criação', () => {
    render(<NetworkForm open mode="create" onClose={vi.fn()} />);

    expect(screen.getByText('Nova Rede de Ensino')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome *')).toHaveValue('');
    expect(
      screen.getByPlaceholderText(
        'Ex: Secretaria Municipal de Educação de Jaboticabal',
      ),
    ).toBeInTheDocument();
  });

  it('renderiza em modo de edição com o nome inicial', () => {
    render(
      <NetworkForm open mode="edit" initialData={rede} onClose={vi.fn()} />,
    );

    expect(screen.getByText('Editar Rede de Ensino')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome *')).toHaveValue('Rede A');
  });

  it('valida o nome antes de criar', async () => {
    render(<NetworkForm open mode="create" onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(
        screen.getByText('Nome é obrigatório e deve ter no mínimo 2 caracteres'),
      ).toBeInTheDocument(),
    );
    expect(createNetwork).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'A' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(
        screen.getByText('Nome é obrigatório e deve ter no mínimo 2 caracteres'),
      ).toBeInTheDocument(),
    );
    expect(createNetwork).not.toHaveBeenCalled();
  });

  it('cria a rede com o nome preenchido', async () => {
    createNetwork.mockResolvedValue({ id: 1 });
    const onClose = vi.fn();

    render(<NetworkForm open mode="create" onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Rede Nova' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(createNetwork).toHaveBeenCalledWith({ name: 'Rede Nova' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(updateNetwork).not.toHaveBeenCalled();
  });

  it('atualiza a rede existente', async () => {
    updateNetwork.mockResolvedValue({});
    const onClose = vi.fn();

    render(
      <NetworkForm open mode="edit" initialData={rede} onClose={onClose} />,
    );

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Rede Renomeada' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(updateNetwork).toHaveBeenCalledWith(5, {
        name: 'Rede Renomeada',
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('em modo de edição sem dados iniciais apenas fecha o modal', async () => {
    const onClose = vi.fn();

    render(
      <NetworkForm open mode="edit" initialData={null} onClose={onClose} />,
    );

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Rede Nova' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(updateNetwork).not.toHaveBeenCalled();
  });

  it('mostra "Salvando..." e desabilita o botão durante o envio', async () => {
    let resolveCreate: (value: unknown) => void = () => {};
    createNetwork.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    render(<NetworkForm open mode="create" onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Rede Nova' },
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

  it('fecha ao clicar em Cancelar, fora do modal, e não fecha ao clicar dentro', () => {
    const onClose = vi.fn();

    render(<NetworkForm open mode="create" onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nova Rede de Ensino'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByText('Nova Rede de Ensino').parentElement!.parentElement!,
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
