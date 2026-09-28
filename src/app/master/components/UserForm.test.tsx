import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserForm } from './UserForm';
import { useUsers } from '@/hooks/useUsers';
import { PROFILE } from '@/constants/profile';
import type { School } from '@/types/master';

vi.mock('@/hooks/useUsers', () => ({ useUsers: vi.fn() }));

const createUser = vi.fn();

const escolas: School[] = [
  {
    id: 10,
    name: 'Escola A',
    networkId: 1,
    substitutionLimitPerSemester: null,
    priorityWindowHours: null,
    createdAt: '2026-01-01',
  },
  {
    id: 20,
    name: 'Escola B',
    networkId: 1,
    substitutionLimitPerSemester: null,
    priorityWindowHours: null,
    createdAt: '2026-01-02',
  },
];

function mockHook() {
  vi.mocked(useUsers).mockReturnValue({
    users: [],
    loading: false,
    error: null,
    createUser,
    unlinkUser: vi.fn(),
    refetch: vi.fn(),
  } as any);
}

describe('UserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook();
  });

  it('não renderiza nada quando fechado', () => {
    const { container } = render(
      <UserForm
        open={false}
        profileId={PROFILE.DIRETOR}
        schools={escolas}
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza como Novo Diretor para o perfil DIRETOR', () => {
    render(
      <UserForm
        open
        profileId={PROFILE.DIRETOR}
        schools={escolas}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Novo Diretor')).toBeInTheDocument();
    expect(useUsers).toHaveBeenCalledWith(PROFILE.DIRETOR);
    expect(screen.getByText('Escola A')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Selecione uma escola' }),
    ).toHaveValue('0');
  });

  it('renderiza como Novo Administrador para o perfil AUXILIAR_ADMIN', () => {
    render(
      <UserForm
        open
        profileId={PROFILE.AUXILIAR_ADMIN}
        schools={escolas}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Novo Administrador')).toBeInTheDocument();
    expect(useUsers).toHaveBeenCalledWith(PROFILE.AUXILIAR_ADMIN);
  });

  it('valida nome, email e escola antes de criar', async () => {
    render(
      <UserForm
        open
        profileId={PROFILE.DIRETOR}
        schools={escolas}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(
        screen.getByText('Nome é obrigatório e deve ter no mínimo 2 caracteres'),
      ).toBeInTheDocument(),
    );
    expect(createUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Ana' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(screen.getByText('Email válido é obrigatório')).toBeInTheDocument(),
    );
    expect(createUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'sem-arroba' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(screen.getByText('Email válido é obrigatório')).toBeInTheDocument(),
    );
    expect(createUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'ana@escola.com' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(
        screen.getByText('Selecionar uma escola é obrigatório'),
      ).toBeInTheDocument(),
    );
    expect(createUser).not.toHaveBeenCalled();
  });

  it('cria o usuário com telefone preenchido', async () => {
    createUser.mockResolvedValue({ id: 1 });
    const onClose = vi.fn();

    render(
      <UserForm
        open
        profileId={PROFILE.DIRETOR}
        schools={escolas}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'ana@escola.com' },
    });
    fireEvent.change(screen.getByLabelText('Telefone'), {
      target: { value: '(11) 99999-9999' },
    });
    fireEvent.change(screen.getByLabelText('Escola *'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith({
        name: 'Ana',
        email: 'ana@escola.com',
        phone: '(11) 99999-9999',
        schoolId: 10,
        profileId: PROFILE.DIRETOR,
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('omite o telefone quando em branco', async () => {
    createUser.mockResolvedValue({ id: 1 });

    render(
      <UserForm
        open
        profileId={PROFILE.AUXILIAR_ADMIN}
        schools={escolas}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Bia' },
    });
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'bia@escola.com' },
    });
    fireEvent.change(screen.getByLabelText('Escola *'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(createUser).toHaveBeenCalledWith({
        name: 'Bia',
        email: 'bia@escola.com',
        phone: undefined,
        schoolId: 20,
        profileId: PROFILE.AUXILIAR_ADMIN,
      }),
    );
  });

  it('mostra "Salvando..." e desabilita o botão durante o envio', async () => {
    let resolveCreate: (value: unknown) => void = () => {};
    createUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    render(
      <UserForm
        open
        profileId={PROFILE.DIRETOR}
        schools={escolas}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'ana@escola.com' },
    });
    fireEvent.change(screen.getByLabelText('Escola *'), {
      target: { value: '10' },
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

    render(
      <UserForm
        open
        profileId={PROFILE.DIRETOR}
        schools={escolas}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Novo Diretor'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Novo Diretor').parentElement!.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
