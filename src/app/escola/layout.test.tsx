import { render, screen, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EscolaLayout from './layout';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';
import { useRouter, usePathname } from 'next/navigation';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));

function mockContext(user: unknown, isLoading = false) {
  vi.mocked(useSchoolContext).mockReturnValue({
    user,
    isLoading,
    logout: vi.fn(),
    refreshUserData: vi.fn(),
    schoolLinks: [],
    activeSchoolId: null,
    activeProfileId: null,
    activeNetworkId: null,
    setActiveSchoolId: vi.fn(),
  } as any);
}

describe('EscolaLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as any);
    vi.mocked(usePathname).mockReturnValue('/escola/jornada-docente');
  });

  it('mostra o carregando enquanto os dados do usuário não chegam', () => {
    mockContext(null, true);
    render(
      <EscolaLayout>
        <span>conteúdo da escola</span>
      </EscolaLayout>,
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('conteúdo da escola')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('redireciona para o login quando não há usuário', async () => {
    mockContext(null);
    render(
      <EscolaLayout>
        <span>conteúdo da escola</span>
      </EscolaLayout>,
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('redireciona para o dashboard quando o perfil não tem acesso à área escolar', async () => {
    mockContext({ id: 7, name: 'Professor', profileId: PROFILE.PROFESSOR });
    render(
      <EscolaLayout>
        <span>conteúdo da escola</span>
      </EscolaLayout>,
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
    expect(screen.queryByText('conteúdo da escola')).not.toBeInTheDocument();
  });

  it('renderiza a sidebar e o conteúdo para DIRETOR', () => {
    mockContext({ id: 1, name: 'Diretora', profileId: PROFILE.DIRETOR });
    render(
      <EscolaLayout>
        <span>conteúdo da escola</span>
      </EscolaLayout>,
    );

    expect(screen.getByText('conteúdo da escola')).toBeInTheDocument();
    expect(screen.getByText('Gestão Escolar')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('renderiza para AUXILIAR_ADMIN', () => {
    mockContext({ id: 2, name: 'Auxiliar', profileId: PROFILE.AUXILIAR_ADMIN });
    render(
      <EscolaLayout>
        <span>conteúdo da escola</span>
      </EscolaLayout>,
    );

    expect(screen.getByText('conteúdo da escola')).toBeInTheDocument();
  });

  it('renderiza para MASTER', () => {
    mockContext({ id: 4, name: 'Master', profileId: PROFILE.MASTER });
    render(
      <EscolaLayout>
        <span>conteúdo da escola</span>
      </EscolaLayout>,
    );

    expect(screen.getByText('conteúdo da escola')).toBeInTheDocument();
  });
});
