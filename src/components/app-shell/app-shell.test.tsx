import { render, screen, fireEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePathname } from 'next/navigation';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useSubstitutionLimit } from '@/hooks/useSubstitutionLimit';
import { PROFILE } from '@/constants/profile';
import { AppShell } from './index';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));
vi.mock('@/hooks/useSubstitutionLimit', () => ({ useSubstitutionLimit: vi.fn() }));
vi.mock('@/components/NotificationBell', () => ({ NotificationBell: () => <span>sino</span> }));
vi.mock('@/components/SchoolSelector', () => ({ SchoolSelector: () => null }));

const logout = vi.fn();

function mockUser(user: Record<string, unknown> | null, schoolLinks: unknown[] = []) {
  vi.mocked(useSchoolContext).mockReturnValue({ user, schoolLinks, logout } as any);
}

function renderShell() {
  return render(
    <AppShell>
      <p>conteúdo da tela</p>
    </AppShell>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue('/escola/professores');
    vi.mocked(useSubstitutionLimit).mockReturnValue({
      current: 2,
      limit: 5,
      percentage: 40,
      canApply: true,
      loading: false,
      error: null,
    } as any);
  });

  it('mostra o conteúdo, quem está logado e o perfil', () => {
    mockUser({ id: 1, name: 'Ana Souza', profileId: PROFILE.DIRETOR, schoolId: 3 });
    renderShell();

    expect(screen.getByText('conteúdo da tela')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Diretor')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('sino')).toBeInTheDocument();
  });

  it('marca o item da tela atual', () => {
    mockUser({ id: 1, name: 'Ana', profileId: PROFILE.DIRETOR });
    renderShell();

    expect(screen.getByRole('link', { name: 'Professores' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Painel' })).not.toHaveAttribute('aria-current');
  });

  it('D12: MASTER tem o link para a Área Master', () => {
    mockUser({ id: 1, name: 'Master', profileId: PROFILE.MASTER });
    renderShell();

    expect(screen.getByRole('link', { name: 'Área Master' })).toHaveAttribute('href', '/master/dashboard');
  });

  it('diretor não vê a Área Master', () => {
    mockUser({ id: 1, name: 'Ana', profileId: PROFILE.DIRETOR });
    renderShell();

    expect(screen.queryByRole('link', { name: 'Área Master' })).not.toBeInTheDocument();
  });

  it('coordenador municipal tem a seção da rede', () => {
    mockUser({ id: 9, name: 'Coord', profileId: PROFILE.COORDENADOR_MUNICIPAL, schoolId: 4 });
    renderShell();

    expect(screen.getByText('Rede (município)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Escolas' })).toHaveAttribute('href', '/master/escolas');
  });

  it('"Sair" chama o logout', () => {
    mockUser({ id: 1, name: 'Ana', profileId: PROFILE.DIRETOR });
    renderShell();

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(logout).toHaveBeenCalled();
  });

  it('o botão do menu abre e fecha a gaveta (celular)', () => {
    mockUser({ id: 1, name: 'Ana', profileId: PROFILE.DIRETOR });
    const { container } = renderShell();

    // O botão só aparece no celular (media query); no jsdom ele conta como
    // oculto e fica sem nome acessível, então é achado pelo aria-controls.
    const button = container.querySelector('[aria-controls="app-menu"]')!;
    expect(button).toHaveAttribute('aria-label', 'Abrir menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', 'Fechar menu');
    expect(button).toHaveAttribute('aria-expanded', 'true');

    // Escolher uma tela fecha a gaveta.
    fireEvent.click(screen.getByRole('link', { name: 'Indicadores' }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('professor com escola vê o contador de substituições', () => {
    mockUser({ id: 7, name: 'Carla', profileId: PROFILE.PROFESSOR, schoolId: 3 });
    renderShell();

    expect(useSubstitutionLimit).toHaveBeenCalledWith(7);
    expect(screen.getByText(/2 de 5/)).toBeInTheDocument();
  });

  it('professor sem escola e gestores não veem o contador', () => {
    mockUser({ id: 7, name: 'Carla', profileId: PROFILE.PROFESSOR, schoolId: null });
    const { unmount } = renderShell();
    expect(screen.queryByText(/2 de 5/)).not.toBeInTheDocument();
    unmount();

    mockUser({ id: 1, name: 'Ana', profileId: PROFILE.DIRETOR, schoolId: 3 });
    renderShell();
    expect(useSubstitutionLimit).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByText(/2 de 5/)).not.toBeInTheDocument();
  });

  it('sem usuário mostra a moldura vazia sem quebrar', () => {
    mockUser(null);
    vi.mocked(usePathname).mockReturnValue(null as any);
    renderShell();

    expect(screen.getByText('conteúdo da tela')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument();
  });
});
