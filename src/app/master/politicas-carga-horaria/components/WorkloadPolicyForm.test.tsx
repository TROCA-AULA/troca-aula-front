import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkloadPolicyForm } from './WorkloadPolicyForm';
import { useWorkloadPolicies } from '@/hooks/useWorkloadPolicies';
import { useNetworks } from '@/hooks/useNetworks';
import type { WorkloadPolicy } from '@/types/master';

vi.mock('@/hooks/useWorkloadPolicies', () => ({
  useWorkloadPolicies: vi.fn(),
}));
vi.mock('@/hooks/useNetworks', () => ({ useNetworks: vi.fn() }));

const createPolicy = vi.fn();
const updatePolicy = vi.fn();

const networks = [{ id: 1, name: 'Rede A', createdAt: '2026-01-01' }];

const politica: WorkloadPolicy = {
  id: 5,
  networkId: 1,
  workloadTypeId: 2,
  maxHoursPerWeek: 20,
  ataOficialRequired: false,
  createdAt: '2026-01-01',
};

function mockHooks(networksLoading = false) {
  vi.mocked(useWorkloadPolicies).mockReturnValue({
    policies: [],
    loading: false,
    error: null,
    createPolicy,
    updatePolicy,
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

describe('WorkloadPolicyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHooks();
  });

  it('não renderiza nada quando fechado', () => {
    const { container } = render(
      <WorkloadPolicyForm open={false} mode="create" onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza em modo de criação com os tipos de carga e rede padrão', () => {
    render(
      <WorkloadPolicyForm
        open
        mode="create"
        defaultNetworkId={1}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Nova Política de Carga Horária'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Rede de Ensino *')).toHaveValue('1');
    expect(screen.getByLabelText('Tipo de Carga Horária *')).toHaveValue('');
    expect(
      screen.getByText('Horas-aula de interação com alunos'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Exige referência de ata oficial')).toBeChecked();
  });

  it('renderiza em modo de edição com os dados iniciais', () => {
    render(
      <WorkloadPolicyForm
        open
        mode="edit"
        initialData={politica}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Editar Política')).toBeInTheDocument();
    expect(screen.getByLabelText('Rede de Ensino *')).toHaveValue('1');
    expect(screen.getByLabelText('Tipo de Carga Horária *')).toHaveValue('2');
    expect(screen.getByLabelText('Limite de horas por semana')).toHaveValue(20);
    expect(
      screen.getByLabelText('Exige referência de ata oficial'),
    ).not.toBeChecked();
  });

  it('desabilita o select de redes enquanto elas carregam', () => {
    mockHooks(true);

    render(<WorkloadPolicyForm open mode="create" onClose={vi.fn()} />);

    expect(screen.getByLabelText('Rede de Ensino *')).toBeDisabled();
  });

  it('valida rede e tipo de carga antes de salvar', async () => {
    render(<WorkloadPolicyForm open mode="create" onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(screen.getByText('Rede é obrigatória')).toBeInTheDocument(),
    );
    expect(createPolicy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(screen.getByText('Tipo de carga é obrigatório')).toBeInTheDocument(),
    );
    expect(createPolicy).not.toHaveBeenCalled();
  });

  it('cria a política com limite de horas e ata obrigatória', async () => {
    createPolicy.mockResolvedValue({ id: 1 });
    const onClose = vi.fn();

    render(<WorkloadPolicyForm open mode="create" onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Tipo de Carga Horária *'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText('Limite de horas por semana'), {
      target: { value: '12.5' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(createPolicy).toHaveBeenCalledWith({
        networkId: 1,
        workloadTypeId: 3,
        maxHoursPerWeek: 12.5,
        ataOficialRequired: true,
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(updatePolicy).not.toHaveBeenCalled();
  });

  it('envia limite indefinido e ata desmarcada quando configurado assim', async () => {
    createPolicy.mockResolvedValue({ id: 1 });

    render(<WorkloadPolicyForm open mode="create" onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Tipo de Carga Horária *'), {
      target: { value: '1' },
    });
    fireEvent.click(
      screen.getByLabelText('Exige referência de ata oficial'),
    );
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(createPolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          maxHoursPerWeek: undefined,
          ataOficialRequired: false,
        }),
      ),
    );
  });

  it('atualiza a política existente', async () => {
    updatePolicy.mockResolvedValue({});
    const onClose = vi.fn();

    render(
      <WorkloadPolicyForm
        open
        mode="edit"
        initialData={politica}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(updatePolicy).toHaveBeenCalledWith(5, {
        networkId: 1,
        workloadTypeId: 2,
        maxHoursPerWeek: 20,
        ataOficialRequired: false,
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('edita política sem limite de horas definido', async () => {
    updatePolicy.mockResolvedValue({});

    render(
      <WorkloadPolicyForm
        open
        mode="edit"
        initialData={{ ...politica, maxHoursPerWeek: null }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Limite de horas por semana')).toHaveValue(
      null,
    );
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(updatePolicy).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ maxHoursPerWeek: undefined }),
      ),
    );
  });

  it('em modo de edição sem dados iniciais apenas fecha o modal', async () => {
    const onClose = vi.fn();

    render(
      <WorkloadPolicyForm
        open
        mode="edit"
        initialData={null}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Tipo de Carga Horária *'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(updatePolicy).not.toHaveBeenCalled();
  });

  it('mostra "Salvando..." e desabilita o botão durante o envio', async () => {
    let resolveCreate: (value: unknown) => void = () => {};
    createPolicy.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    render(<WorkloadPolicyForm open mode="create" onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Rede de Ensino *'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Tipo de Carga Horária *'), {
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

  it('fecha ao clicar em Cancelar, fora do modal, e não fecha ao clicar dentro', () => {
    const onClose = vi.fn();

    render(<WorkloadPolicyForm open mode="create" onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nova Política de Carga Horária'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByText('Nova Política de Carga Horária').parentElement!
        .parentElement!,
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
