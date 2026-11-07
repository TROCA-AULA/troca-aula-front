import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AlterarSenhaPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { accountService } from '@/services/account.service';
import { toast } from 'react-toastify';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/services/account.service', () => ({
  accountService: {
    changePassword: vi.fn(),
    resetUserPassword: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('AlterarSenhaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 1, name: 'Test', email: 't@t.com', profileId: 3 },
      isLoading: false,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: 3,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    } as any);
  });

  it('changes the password and redirects on success', async () => {
    vi.mocked(accountService.changePassword).mockResolvedValue({
      message: 'Senha alterada com sucesso',
    });

    render(<AlterarSenhaPage />);

    fireEvent.change(screen.getByLabelText('Senha atual'), {
      target: { value: 'current-pass' },
    });
    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'new-pass-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'new-pass-123' },
    });
    fireEvent.click(screen.getByText('Salvar nova senha'));

    await waitFor(() => {
      expect(accountService.changePassword).toHaveBeenCalledWith(
        'current-pass',
        'new-pass-123',
      );
      expect(toast.success).toHaveBeenCalledWith('Senha alterada com sucesso');
      expect(push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('blocks submission when the new password is too short', async () => {
    render(<AlterarSenhaPage />);

    fireEvent.change(screen.getByLabelText('Senha atual'), {
      target: { value: 'current-pass' },
    });
    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByText('Salvar nova senha'));

    await waitFor(() => {
      expect(
        screen.getByText('A nova senha precisa ter pelo menos 8 caracteres.'),
      ).toBeInTheDocument();
    });
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it('blocks submission when the confirmation does not match', async () => {
    render(<AlterarSenhaPage />);

    fireEvent.change(screen.getByLabelText('Senha atual'), {
      target: { value: 'current-pass' },
    });
    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'new-pass-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'other-pass-123' },
    });
    fireEvent.click(screen.getByText('Salvar nova senha'));

    await waitFor(() => {
      expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument();
    });
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });
});
