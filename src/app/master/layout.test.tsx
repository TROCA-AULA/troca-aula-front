import { render, screen, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MasterLayout from './layout';
import { useRouter, usePathname } from 'next/navigation';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/master/dashboard'),
}));

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>
      <nav>moldura</nav>
      {children}
    </div>
  ),
}));

const push = vi.fn();

function mockContext(user: unknown, isLoading = false, schoolLinks: unknown[] = []) {
  vi.mocked(useSchoolContext).mockReturnValue({ user, isLoading, schoolLinks } as any);
}

const coordLinks = [{ schoolId: 4, profileId: 5, approvedAt: '2026-10-01', networkId: 2 }];
const coordUser = { id: 9, name: 'Coord', profileId: 5 };

describe('MasterLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as any);
  });

  it('mostra "Carregando..." enquanto o contexto carrega', () => {
    mockContext(null, true);

    render(
      <MasterLayout>
        <div>conteudo</div>
      </MasterLayout>,
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('moldura')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('redireciona para o login quando não há usuário', async () => {
    mockContext(null);

    render(
      <MasterLayout>
        <div>conteudo</div>
      </MasterLayout>,
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('redireciona para o dashboard quando o perfil não é MASTER', async () => {
    mockContext({ id: 1, name: 'Ana', profileId: PROFILE.DIRETOR });

    render(
      <MasterLayout>
        <div>conteudo</div>
      </MasterLayout>,
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renderiza a área administrativa para o MASTER', () => {
    mockContext({ id: 1, name: 'Master', profileId: PROFILE.MASTER });

    render(
      <MasterLayout>
        <div>conteudo</div>
      </MasterLayout>,
    );

    expect(screen.getByText('moldura')).toBeInTheDocument();
    expect(screen.getByText('conteudo')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('deixa o coordenador municipal entrar nas telas de rede', () => {
    vi.mocked(usePathname).mockReturnValue('/master/escolas');
    mockContext(coordUser, false, coordLinks);

    render(
      <MasterLayout>
        <span>escolas da rede</span>
      </MasterLayout>,
    );

    expect(screen.getByText('escolas da rede')).toBeInTheDocument();
    expect(screen.getByText('moldura')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('manda o coordenador para Escolas quando abre tela só do Master', async () => {
    vi.mocked(usePathname).mockReturnValue('/master/coordenadores');
    mockContext(coordUser, false, coordLinks);

    render(
      <MasterLayout>
        <span>coordenadores</span>
      </MasterLayout>,
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith('/master/escolas'));
    expect(screen.queryByText('coordenadores')).not.toBeInTheDocument();
  });
});
