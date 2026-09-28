import { render, screen } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscolaSidebar } from './EscolaSidebar';
import { usePathname } from 'next/navigation';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));

describe('EscolaSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue('/escola/jornada-docente');
  });

  it('renderiza a logo e todos os itens de navegação da área escolar', () => {
    render(<EscolaSidebar />);

    expect(screen.getByText('Gestão Escolar')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Painel' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getByRole('link', { name: 'Jornada Docente' })).toHaveAttribute(
      'href',
      '/escola/jornada-docente',
    );
    expect(screen.getByRole('link', { name: 'Fechamento de Ponto' })).toHaveAttribute(
      'href',
      '/escola/fechamento-ponto',
    );
    expect(screen.getByRole('link', { name: 'Indicadores' })).toHaveAttribute(
      'href',
      '/escola/indicadores',
    );
    expect(screen.getByRole('link', { name: 'Prioridade de Vagas' })).toHaveAttribute(
      'href',
      '/escola/prioridade',
    );
  });

  it('destaca apenas o item correspondente à rota atual', () => {
    render(<EscolaSidebar />);

    const active = screen.getByRole('link', { name: 'Jornada Docente' });
    const inactive = screen.getByRole('link', { name: 'Painel' });

    expect(active.className).not.toBe(inactive.className);
  });

  it('destaca outro item quando a rota muda', () => {
    vi.mocked(usePathname).mockReturnValue('/escola/prioridade');
    render(<EscolaSidebar />);

    const active = screen.getByRole('link', { name: 'Prioridade de Vagas' });
    const inactive = screen.getByRole('link', { name: 'Jornada Docente' });

    expect(active.className).not.toBe(inactive.className);
  });
});
