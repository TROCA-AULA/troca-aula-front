import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdministradoresPage from './page';
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

describe('AdministradoresPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('usa o perfil AUXILIAR_ADMIN e lista os administradores', () => {
    vi.mocked(useUsers).mockReturnValue({
      users: [
        { id: 2, name: 'Bia', email: 'bia@e.com', phone: '2', profileId: 2, schoolId: 10 },
      ],
      loading: false,
      error: null,
      createUser: vi.fn(),
      unlinkUser,
      refetch: vi.fn(),
    } as any);

    render(<AdministradoresPage />);

    expect(useUsers).toHaveBeenCalledWith(PROFILE.AUXILIAR_ADMIN);
    expect(screen.getByText('Bia')).toBeInTheDocument();
  });

  it('abre o formulário e desvincula com confirmação', async () => {
    vi.mocked(useUsers).mockReturnValue({
      users: [
        { id: 2, name: 'Bia', email: 'bia@e.com', phone: '2', profileId: 2, schoolId: 10 },
      ],
      loading: false,
      error: null,
      createUser: vi.fn(),
      unlinkUser,
      refetch: vi.fn(),
    } as any);

    render(<AdministradoresPage />);

    fireEvent.click(screen.getByText('+ Novo Administrador'));
    expect(screen.getByText('form-aberto')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Desvincular'));
    const buttons = screen.getAllByText('Desvincular');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() =>
      expect(unlinkUser).toHaveBeenCalledWith(2, PROFILE.AUXILIAR_ADMIN, 10),
    );
  });
});
