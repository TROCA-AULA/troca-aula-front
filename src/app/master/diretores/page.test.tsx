import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiretoresPage from './page';
import { useUsers } from '@/hooks/useUsers';
import { useSchools } from '@/hooks/useSchools';
import { PROFILE } from '@/constants/profile';

vi.mock('@/hooks/useUsers', () => ({ useUsers: vi.fn() }));
vi.mock('@/hooks/useSchools', () => ({ useSchools: vi.fn() }));
vi.mock('../components/UserForm', () => ({
  UserForm: ({ open }: { open: boolean }) =>
    open ? <div>form-aberto</div> : null,
}));

const unlinkUser = vi.fn();

function mockPage(users: unknown[], loading = false) {
  vi.mocked(useUsers).mockReturnValue({
    users,
    loading,
    error: null,
    createUser: vi.fn(),
    unlinkUser,
    refetch: vi.fn(),
  } as any);
  vi.mocked(useSchools).mockReturnValue({
    schools: [{ id: 10, name: 'Escola A', networkId: 1, createdAt: '2026-01-01' }],
    loading: false,
    error: null,
    createSchool: vi.fn(),
    updateSchool: vi.fn(),
    updatePriorityWindow: vi.fn(),
    deleteSchool: vi.fn(),
    refetch: vi.fn(),
  } as any);
}

describe('DiretoresPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca usuários com o perfil DIRETOR e lista com a escola resolvida', async () => {
    mockPage([
      { id: 1, name: 'Ana', email: 'ana@e.com', phone: '1', profileId: 1, schoolId: 10 },
    ]);

    render(<DiretoresPage />);

    expect(useUsers).toHaveBeenCalledWith(PROFILE.DIRETOR);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Escola A')).toBeInTheDocument();
  });

  it('abre o formulário ao clicar em novo diretor', () => {
    mockPage([]);

    render(<DiretoresPage />);
    fireEvent.click(screen.getByText('+ Novo Diretor'));

    expect(screen.getByText('form-aberto')).toBeInTheDocument();
  });

  it('desvincula após confirmação', async () => {
    mockPage([
      { id: 1, name: 'Ana', email: 'ana@e.com', phone: '1', profileId: 1, schoolId: 10 },
    ]);
    unlinkUser.mockResolvedValue(undefined);

    render(<DiretoresPage />);
    fireEvent.click(screen.getByText('Desvincular'));

    const buttons = screen.getAllByText('Desvincular');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() =>
      expect(unlinkUser).toHaveBeenCalledWith(1, PROFILE.DIRETOR, 10),
    );
  });

  it('mostra o estado de carregamento', () => {
    mockPage([], true);

    render(<DiretoresPage />);

    // P13: estado de carregamento agora é skeleton (não mais texto).
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });
});
