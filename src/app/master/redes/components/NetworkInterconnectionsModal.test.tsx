import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkInterconnectionsModal } from './NetworkInterconnectionsModal';
import { useInterconnections } from '@/hooks/useEligibility';
import type { Network } from '@/types/master';

vi.mock('@/hooks/useEligibility', () => ({ useInterconnections: vi.fn() }));

const save = vi.fn();

const networks: Network[] = [
  { id: 1, name: 'Rede A', createdAt: '2026-01-01' },
  { id: 2, name: 'Rede B', createdAt: '2026-01-02' },
  { id: 3, name: 'Rede C', createdAt: '2026-01-03' },
];

function mockHook(
  data: {
    networkId: number;
    interconnections: { networkId: number; networkName: string }[];
  } | null = null,
) {
  vi.mocked(useInterconnections).mockReturnValue({
    data,
    loading: false,
    save,
  });
}

describe('NetworkInterconnectionsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook();
  });

  it('não renderiza nada quando fechado e consulta o hook com null', () => {
    const { container } = render(
      <NetworkInterconnectionsModal
        open={false}
        network={networks[0]}
        networks={networks}
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(useInterconnections).toHaveBeenCalledWith(null);
  });

  it('não renderiza nada quando não há rede selecionada', () => {
    const { container } = render(
      <NetworkInterconnectionsModal
        open
        network={null}
        networks={networks}
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(useInterconnections).toHaveBeenCalledWith(null);
  });

  it('lista as outras redes com as interconexões já marcadas', () => {
    mockHook({
      networkId: 1,
      interconnections: [{ networkId: 2, networkName: 'Rede B' }],
    });

    render(
      <NetworkInterconnectionsModal
        open
        network={networks[0]}
        networks={networks}
        onClose={vi.fn()}
      />,
    );

    expect(useInterconnections).toHaveBeenCalledWith(1);
    expect(screen.getByText('Interconexões de Rede A')).toBeInTheDocument();
    expect(
      screen.getByText(/a relação é direcional/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Rede A')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Rede B' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Rede C' })).not.toBeChecked();
  });

  it('não aplica seleção de dados de outra rede', () => {
    mockHook({
      networkId: 99,
      interconnections: [{ networkId: 2, networkName: 'Rede B' }],
    });

    render(
      <NetworkInterconnectionsModal
        open
        network={networks[0]}
        networks={networks}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Rede B' })).not.toBeChecked();
  });

  it('marca e desmarca redes e salva a seleção', async () => {
    save.mockResolvedValue({});
    const onClose = vi.fn();
    mockHook({
      networkId: 1,
      interconnections: [{ networkId: 2, networkName: 'Rede B' }],
    });

    render(
      <NetworkInterconnectionsModal
        open
        network={networks[0]}
        networks={networks}
        onClose={onClose}
      />,
    );

    // Desmarca B e marca C.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Rede B' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Rede C' }));
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith([3]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('mostra "Salvando..." e desabilita os botões durante o envio', async () => {
    let resolveSave: (value: unknown) => void = () => {};
    save.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    mockHook({ networkId: 1, interconnections: [] });

    render(
      <NetworkInterconnectionsModal
        open
        network={networks[0]}
        networks={networks}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Salvar'));

    const botaoSalvando = await screen.findByRole('button', {
      name: 'Salvando...',
    });
    expect(botaoSalvando).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();

    resolveSave({});

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled(),
    );
  });

  it('engole o erro do save e mantém o modal aberto', async () => {
    save.mockRejectedValue(new Error('falha ao salvar'));
    const onClose = vi.fn();
    mockHook({ networkId: 1, interconnections: [] });

    render(
      <NetworkInterconnectionsModal
        open
        network={networks[0]}
        networks={networks}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled(),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fecha ao clicar em Cancelar, fora do modal, e não fecha ao clicar dentro', () => {
    const onClose = vi.fn();
    mockHook({ networkId: 1, interconnections: [] });

    render(
      <NetworkInterconnectionsModal
        open
        network={networks[0]}
        networks={networks}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Interconexões de Rede A'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByText('Interconexões de Rede A').parentElement!
        .parentElement!,
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
