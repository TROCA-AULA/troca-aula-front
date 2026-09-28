import { render, screen, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MasterLayout from './layout';
import { useRouter } from 'next/navigation';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/master/dashboard'),
}));

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('./components/MasterSidebar', () => ({
  MasterSidebar: () => <div>sidebar</div>,
}));

vi.mock('./components/MasterHeader', () => ({
  MasterHeader: ({ userName }: { userName: string }) => (
    <div>header de {userName}</div>
  ),
}));

const push = vi.fn();

function mockContext(user: unknown, isLoading = false) {
  vi.mocked(useSchoolContext).mockReturnValue({ user, isLoading } as any);
}

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
    expect(screen.queryByText('sidebar')).not.toBeInTheDocument();
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

    expect(screen.getByText('sidebar')).toBeInTheDocument();
    expect(screen.getByText('header de Master')).toBeInTheDocument();
    expect(screen.getByText('conteudo')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
