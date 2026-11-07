import { render, screen, waitFor, act } from '@/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GovbrCallbackPage from './page';
import { useGovbrAuth } from '@/hooks/useGovbrAuth';
import { useSearchParams, useRouter } from 'next/navigation';

const push = vi.fn();
const loginWithGovbr = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/useGovbrAuth', () => ({ useGovbrAuth: vi.fn() }));

function mockSearch(params: Record<string, string> = {}) {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(params) as unknown as ReturnType<typeof useSearchParams>,
  );
}

function mockAuth(overrides: Record<string, unknown> = {}) {
  vi.mocked(useGovbrAuth).mockReturnValue({
    isLoading: false,
    error: null,
    loginWithGovbr,
    logout: vi.fn(),
    ...overrides,
  } as any);
}

describe('GovbrCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as any);
    loginWithGovbr.mockResolvedValue(null);
    mockAuth();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra a tela de autenticação enquanto o login está em andamento', () => {
    mockSearch({ code: 'abc' });
    mockAuth({ isLoading: true });

    render(<GovbrCallbackPage />);

    expect(screen.getByText('Autenticando com Gov.br...')).toBeInTheDocument();
    expect(
      screen.getByText('Aguarde enquanto verificamos suas credenciais.'),
    ).toBeInTheDocument();
  });

  it('autentica com sucesso e redireciona para o dashboard após 1,5s', async () => {
    vi.useFakeTimers();
    mockSearch({ code: 'abc' });
    loginWithGovbr.mockResolvedValue({ user: { id: 1 }, token: 'jwt' });

    render(<GovbrCallbackPage />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Autenticado com sucesso!')).toBeInTheDocument();
    expect(screen.getByText('Redirecionando para o dashboard...')).toBeInTheDocument();
    expect(loginWithGovbr).toHaveBeenCalledWith('abc');
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('mostra erro quando o provedor devolve um parâmetro de erro', () => {
    mockSearch({ error: 'access_denied' });

    render(<GovbrCallbackPage />);

    expect(screen.getByText('Falha na autenticação')).toBeInTheDocument();
    expect(loginWithGovbr).not.toHaveBeenCalled();
  });

  it('mostra erro quando não há code na URL', () => {
    mockSearch({});

    render(<GovbrCallbackPage />);

    expect(screen.getByText('Falha na autenticação')).toBeInTheDocument();
    expect(
      screen.getByText('Não foi possível autenticar com Gov.br. Tente novamente.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para login' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(loginWithGovbr).not.toHaveBeenCalled();
  });

  it('mostra a mensagem de erro do hook quando o login retorna null', async () => {
    mockSearch({ code: 'abc' });
    mockAuth({ error: 'Não foi possível iniciar a sessão.' });
    loginWithGovbr.mockResolvedValue(null);

    render(<GovbrCallbackPage />);

    await waitFor(() =>
      expect(screen.getByText('Não foi possível iniciar a sessão.')).toBeInTheDocument(),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('mostra erro quando o login rejeita', async () => {
    mockSearch({ code: 'abc' });
    loginWithGovbr.mockRejectedValue(new Error('boom'));

    render(<GovbrCallbackPage />);

    await waitFor(() =>
      expect(screen.getByText('Falha na autenticação')).toBeInTheDocument(),
    );
    expect(push).not.toHaveBeenCalled();
  });
});
