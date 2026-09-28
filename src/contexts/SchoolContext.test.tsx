import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SchoolProvider, useSchoolContext } from './SchoolContext';

const push = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const STORAGE_KEY = 'troca-aula:activeSchoolId';

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    profileId: 3,
    schoolId: 10,
    schoolLinks: [
      { profileId: 3, schoolId: 10, approvedAt: '2026-01-01T00:00:00Z', networkId: 5 },
      { profileId: 1, schoolId: 20, approvedAt: null, networkId: 6 },
    ],
    ...overrides,
  };
}

function mockFetchOnce(user: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => user,
  });
}

function Probe() {
  const {
    user,
    isLoading,
    logout,
    refreshUserData,
    schoolLinks,
    activeSchoolId,
    activeProfileId,
    activeNetworkId,
    setActiveSchoolId,
  } = useSchoolContext();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.name : 'null'}</span>
      <span data-testid="profile">{String(user?.profileId ?? 'null')}</span>
      <span data-testid="user-school">{String(user?.schoolId ?? 'null')}</span>
      <span data-testid="school">{String(activeSchoolId)}</span>
      <span data-testid="active-profile">{String(activeProfileId)}</span>
      <span data-testid="network">{String(activeNetworkId)}</span>
      <span data-testid="links">{schoolLinks.length}</span>
      <button onClick={refreshUserData}>refresh</button>
      <button onClick={logout}>logout</button>
      <button onClick={() => setActiveSchoolId(20)}>escola-20</button>
      <button onClick={() => setActiveSchoolId(999)}>escola-999</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <SchoolProvider>
      <Probe />
    </SchoolProvider>,
  );
}

describe('SchoolContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carrega o usuário e resolve escola, perfil e rede do vínculo aprovado', async () => {
    global.fetch = mockFetchOnce(makeUser()) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    // Vínculo aprovado é a escola 10 (networkId 5, profileId 3).
    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));
    expect(screen.getByTestId('active-profile')).toHaveTextContent('3');
    expect(screen.getByTestId('network')).toHaveTextContent('5');
    expect(screen.getByTestId('links')).toHaveTextContent('2');
    expect(screen.getByTestId('user-school')).toHaveTextContent('10');
  });

  it('zera o usuário quando /api/auth/me responde não-ok', async () => {
    global.fetch = mockFetchOnce(null, false) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('school')).toHaveTextContent('null');
    expect(screen.getByTestId('links')).toHaveTextContent('0');
  });

  it('zera o usuário e loga o erro quando a busca falha', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Erro ao buscar dados do usuário:',
      expect.any(Error),
    );
  });

  it('respeita a escola salva no localStorage quando ainda é um vínculo válido', async () => {
    window.localStorage.setItem(STORAGE_KEY, '20');
    global.fetch = mockFetchOnce(makeUser()) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('20'));
    expect(screen.getByTestId('active-profile')).toHaveTextContent('1');
    expect(screen.getByTestId('network')).toHaveTextContent('6');
  });

  it('ignora a escola salva inválida e cai para o vínculo aprovado', async () => {
    window.localStorage.setItem(STORAGE_KEY, '99');
    global.fetch = mockFetchOnce(
      makeUser({
        schoolLinks: [
          { profileId: 3, schoolId: 10, approvedAt: null, networkId: 5 },
          { profileId: 1, schoolId: 20, approvedAt: '2026-01-01T00:00:00Z', networkId: 6 },
        ],
      }),
    ) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('20'));
  });

  it('ignora valor não numérico no localStorage e usa o primeiro vínculo sem aprovados', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'nao-numero');
    global.fetch = mockFetchOnce(
      makeUser({
        schoolLinks: [
          { profileId: 3, schoolId: 10, approvedAt: null, networkId: 5 },
          { profileId: 1, schoolId: 20, approvedAt: null, networkId: 6 },
        ],
      }),
    ) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));
  });

  it('não quebra quando o localStorage está indisponível na leitura', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('modo privado');
    });
    global.fetch = mockFetchOnce(makeUser()) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));
  });

  it('mantém perfil/regra do usuário e rede nulos quando não há vínculos', async () => {
    global.fetch = mockFetchOnce(
      makeUser({ schoolLinks: [], profileId: 2, schoolId: null }),
    ) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('null'));
    expect(screen.getByTestId('active-profile')).toHaveTextContent('2');
    expect(screen.getByTestId('network')).toHaveTextContent('null');
    // user.schoolId cai para o valor do payload quando não há escola ativa.
    expect(screen.getByTestId('user-school')).toHaveTextContent('null');
  });

  it('troca a escola ativa e persiste a escolha no localStorage', async () => {
    global.fetch = mockFetchOnce(makeUser()) as unknown as typeof fetch;
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));

    fireEvent.click(screen.getByText('escola-20'));

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('20'));
    expect(screen.getByTestId('active-profile')).toHaveTextContent('1');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('20');
  });

  it('recusa ativar uma escola fora dos vínculos do usuário', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = mockFetchOnce(makeUser()) as unknown as typeof fetch;
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));

    fireEvent.click(screen.getByText('escola-999'));

    expect(screen.getByTestId('school')).toHaveTextContent('10');
    expect(warnSpy).toHaveBeenCalledWith(
      'Tentativa de ativar escola 999 fora dos vínculos do usuário.',
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('não quebra quando o localStorage está indisponível na escrita', async () => {
    global.fetch = mockFetchOnce(makeUser()) as unknown as typeof fetch;
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('modo privado');
    });

    fireEvent.click(screen.getByText('escola-20'));

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('20'));
  });

  it('recarrega os dados do usuário ao chamar refreshUserData', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => makeUser() })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeUser({ name: 'Nome Atualizado' }),
      }) as unknown as typeof fetch;

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Test User'));

    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('Nome Atualizado'),
    );
  });

  it('faz logout, limpa o estado e volta para a raiz', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => makeUser() })
      .mockResolvedValueOnce({ ok: true }) as unknown as typeof fetch;
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Test User'));

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('null'));
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    expect(screen.getByTestId('school')).toHaveTextContent('null');
    expect(push).toHaveBeenCalledWith('/');
  });

  it('loga o erro e não redireciona quando o logout falha', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => makeUser() })
      .mockRejectedValueOnce(new Error('offline')) as unknown as typeof fetch;
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Test User'));

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao fazer logout:', expect.any(Error)),
    );
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('Test User');
  });

  it('lança erro quando useSchoolContext é usado fora do provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useSchoolContext())).toThrow(
      'useSchoolContext precisa ser usado dentro de <SchoolProvider>.',
    );
  });

  it('deixa a rede nula quando o vínculo não tem networkId resolvido', async () => {
    global.fetch = mockFetchOnce(
      makeUser({
        schoolLinks: [{ profileId: 3, schoolId: 10, approvedAt: '2026-01-01T00:00:00Z' }],
      }),
    ) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));
    expect(screen.getByTestId('network')).toHaveTextContent('null');
  });

  it('não quebra quando o usuário não tem perfil nem vínculos', async () => {
    global.fetch = mockFetchOnce(
      makeUser({ schoolLinks: [], profileId: undefined }),
    ) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('null'));
    expect(screen.getByTestId('active-profile')).toHaveTextContent('null');
    expect(screen.getByTestId('network')).toHaveTextContent('null');
  });

  it('mantém a escola anterior durante a transição até os vínculos novos resolverem', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => makeUser() })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Test User', email: 'x@y.com', schoolLinks: [] }),
      }) as unknown as typeof fetch;

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));

    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() => expect(screen.getByTestId('links')).toHaveTextContent('0'));
    await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('null'));
  });
});
