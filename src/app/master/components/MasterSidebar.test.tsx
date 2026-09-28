import { render, screen } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MasterSidebar } from './MasterSidebar';
import { usePathname } from 'next/navigation';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));

const itens = [
  ['Dashboard', '/master/dashboard'],
  ['Redes de Ensino', '/master/redes'],
  ['Escolas', '/master/escolas'],
  ['Políticas de Carga Horária', '/master/politicas-carga-horaria'],
  ['Diretores', '/master/diretores'],
  ['Administradores', '/master/administradores'],
  ['Professores', '/master/professores'],
  ['Auditoria', '/master/auditoria'],
] as const;

describe('MasterSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o menu com todos os itens e hrefs', () => {
    vi.mocked(usePathname).mockReturnValue('/master/dashboard');

    render(<MasterSidebar />);

    expect(
      screen.getByRole('navigation', { name: 'Menu principal' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Troca-Aula Admin')).toBeInTheDocument();

    for (const [label, href] of itens) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href,
      );
    }
  });

  it('destaca apenas o item da rota atual', () => {
    vi.mocked(usePathname).mockReturnValue('/master/redes');

    render(<MasterSidebar />);

    expect(
      screen.getByRole('link', { name: 'Redes de Ensino' }).className,
    ).not.toBe(screen.getByRole('link', { name: 'Escolas' }).className);
  });

  it('mantém o item destacado em subrotas', () => {
    vi.mocked(usePathname).mockReturnValue('/master/redes/123');

    render(<MasterSidebar />);

    expect(
      screen.getByRole('link', { name: 'Redes de Ensino' }).className,
    ).not.toBe(screen.getByRole('link', { name: 'Escolas' }).className);
  });

  it('destaca o item ativo mesmo fora do master', () => {
    vi.mocked(usePathname).mockReturnValue('/outra-area');

    render(<MasterSidebar />);

    const classes = itens.map(
      ([label]) => screen.getByRole('link', { name: label }).className,
    );
    // Nenhum item ativo: todas as classes dinâmicas são iguais entre si.
    expect(new Set(classes).size).toBe(1);
  });
});
