import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import CoordenadoresPage from './page';
import { masterService } from '@/services/master.service';
import { useNetworks } from '@/hooks/useNetworks';

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/hooks/useNetworks', () => ({ useNetworks: vi.fn() }));
vi.mock('@/services/master.service', () => ({
  masterService: {
    getCoordinators: vi.fn(),
    addCoordinator: vi.fn(),
    removeCoordinator: vi.fn(),
  },
}));

const lia = {
  userId: 7,
  userName: 'Lia',
  userEmail: 'lia@x.com',
  userPhone: '1199',
  networkId: 2,
  networkName: 'Jaboticabal',
  approvedAt: '2026-10-01',
};

function fillForm() {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Rui' } });
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'rui@x.com' } });
  fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '11' } });
  fireEvent.change(screen.getByLabelText('Rede (município)'), {
    target: { value: '2' },
  });
}

describe('CoordenadoresPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNetworks).mockReturnValue({
      networks: [
        { id: 1, name: 'Guariba', createdAt: '' },
        { id: 2, name: 'Jaboticabal', createdAt: '' },
      ],
    } as any);
    vi.mocked(masterService.getCoordinators).mockResolvedValue([lia]);
  });

  it('lista os coordenadores', async () => {
    render(<CoordenadoresPage />);

    expect(await screen.findByText('Lia')).toBeInTheDocument();
    expect(screen.getByText('lia@x.com')).toBeInTheDocument();
    expect(screen.getByText('Jaboticabal', { selector: 'td' })).toBeInTheDocument();
  });

  it('mostra vazio quando não há coordenadores ou a busca falha', async () => {
    vi.mocked(masterService.getCoordinators).mockRejectedValue(new Error('x'));
    render(<CoordenadoresPage />);

    expect(
      await screen.findByText('Nenhum coordenador municipal nomeado.'),
    ).toBeInTheDocument();
  });

  it('usa "Rede #id" e "-" quando faltam nome da rede e telefone', async () => {
    vi.mocked(masterService.getCoordinators).mockResolvedValue([
      { ...lia, networkName: null, userPhone: null },
    ]);
    render(<CoordenadoresPage />);

    expect(await screen.findByText('Rede #2')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('o botão só habilita com o formulário completo', async () => {
    render(<CoordenadoresPage />);
    await screen.findByText('Lia');

    const button = screen.getByRole('button', { name: 'Nomear coordenador' });
    expect(button).toBeDisabled();
    fillForm();
    expect(button).toBeEnabled();
  });

  it('cria conta nova e mostra a senha temporária', async () => {
    vi.mocked(masterService.addCoordinator).mockResolvedValue({
      userId: 9,
      created: true,
      tempPassword: 'Abc123456789',
      emailSent: false,
    });
    render(<CoordenadoresPage />);
    await screen.findByText('Lia');

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Nomear coordenador' }));

    await waitFor(() =>
      expect(masterService.addCoordinator).toHaveBeenCalledWith({
        name: 'Rui',
        email: 'rui@x.com',
        phone: '11',
        networkId: 2,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      'Conta criada. Senha temporária de Rui: Abc123456789 (o e-mail não foi enviado; repasse à pessoa — a senha não fica salva em outro lugar).',
      { autoClose: false },
    );
    expect(masterService.getCoordinators).toHaveBeenCalledTimes(2);
  });

  it('vincula quem já tem cadastro', async () => {
    vi.mocked(masterService.addCoordinator).mockResolvedValue({
      userId: 9,
      created: false,
    });
    render(<CoordenadoresPage />);
    await screen.findByText('Lia');

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Nomear coordenador' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Coordenador vinculado (a pessoa já tinha cadastro)',
      ),
    );
  });

  it('não quebra quando o backend recusa', async () => {
    vi.mocked(masterService.addCoordinator).mockRejectedValue(new Error('400'));
    render(<CoordenadoresPage />);
    await screen.findByText('Lia');

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Nomear coordenador' }));

    await waitFor(() => expect(masterService.addCoordinator).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Nomear coordenador' })).toBeEnabled();
  });

  it('não envia formulário incompleto', async () => {
    render(<CoordenadoresPage />);
    await screen.findByText('Lia');

    fireEvent.submit(screen.getByLabelText('Nome').closest('form')!);
    expect(masterService.addCoordinator).not.toHaveBeenCalled();
  });

  it('remove após confirmar; cancelar não remove', async () => {
    vi.mocked(masterService.removeCoordinator).mockResolvedValue();
    render(<CoordenadoresPage />);
    await screen.findByText('Lia');

    fireEvent.click(screen.getByLabelText('Remover Lia'));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(masterService.removeCoordinator).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Remover Lia'));
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    await waitFor(() =>
      expect(masterService.removeCoordinator).toHaveBeenCalledWith(7, 2),
    );
    expect(toast.success).toHaveBeenCalledWith(
      'Lia não coordena mais Jaboticabal',
    );
  });

  it('não quebra quando a remoção falha', async () => {
    vi.mocked(masterService.removeCoordinator).mockRejectedValue(new Error('404'));
    render(<CoordenadoresPage />);
    await screen.findByText('Lia');

    fireEvent.click(screen.getByLabelText('Remover Lia'));
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    await waitFor(() => expect(masterService.removeCoordinator).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });
});
