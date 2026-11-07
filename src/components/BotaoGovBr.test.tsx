import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BotaoGovBr } from './BotaoGovBr';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({
  authService: { getGovbrAuthUrl: vi.fn(), loginWithGovbr: vi.fn() },
}));

describe('BotaoGovBr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renderiza o botão de entrar com gov.br', () => {
    render(<BotaoGovBr />);

    expect(screen.getByRole('button', { name: 'Entrar com Gov.br' })).toBeInTheDocument();
    expect(screen.getByText('Entrar com gov.br')).toBeInTheDocument();
  });

  it('redireciona para a URL de autenticação ao clicar', async () => {
    const fakeLocation = { href: 'http://localhost/' };
    vi.stubGlobal('location', fakeLocation);
    vi.mocked(authService.getGovbrAuthUrl).mockResolvedValue({
      url: 'https://sso.acesso.gov.br/authorize?client_id=1',
      state: 'estado-123',
    });

    render(<BotaoGovBr />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com Gov.br' }));

    await waitFor(() =>
      expect(fakeLocation.href).toBe('https://sso.acesso.gov.br/authorize?client_id=1'),
    );
    expect(authService.getGovbrAuthUrl).toHaveBeenCalledTimes(1);
  });

  it('não redireciona quando o serviço não devolve URL', async () => {
    const fakeLocation = { href: 'http://localhost/' };
    vi.stubGlobal('location', fakeLocation);
    vi.mocked(authService.getGovbrAuthUrl).mockResolvedValue({ url: '', state: 'estado-123' });

    render(<BotaoGovBr />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com Gov.br' }));

    await waitFor(() => expect(authService.getGovbrAuthUrl).toHaveBeenCalled());
    expect(fakeLocation.href).toBe('http://localhost/');
  });

  it('registra o erro no console quando a busca da URL falha', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(authService.getGovbrAuthUrl).mockRejectedValue(new Error('falha'));

    render(<BotaoGovBr />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com Gov.br' }));

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erro ao iniciar autenticação Gov.br',
        expect.any(Error),
      ),
    );
  });
});
