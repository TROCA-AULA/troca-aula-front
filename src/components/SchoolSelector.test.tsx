import { render, screen, fireEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchoolSelector } from './SchoolSelector';
import { useSchoolContext } from '@/contexts/SchoolContext';

vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));

const setActiveSchoolId = vi.fn();

function mockContext(schoolLinks: unknown[], activeSchoolId: number | null) {
  vi.mocked(useSchoolContext).mockReturnValue({
    user: null,
    isLoading: false,
    logout: vi.fn(),
    refreshUserData: vi.fn(),
    schoolLinks,
    activeSchoolId,
    activeProfileId: null,
    activeNetworkId: null,
    setActiveSchoolId,
  } as any);
}

describe('SchoolSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza nada quando o usuário não tem vínculos', () => {
    mockContext([], null);
    const { container } = render(<SchoolSelector />);

    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada quando o usuário tem só uma escola', () => {
    mockContext([{ schoolId: 10, profileId: 3, approvedAt: '2026-01-01' }], 10);
    const { container } = render(<SchoolSelector />);

    expect(container).toBeEmptyDOMElement();
  });

  it('lista as escolas vinculadas quando há mais de uma', () => {
    mockContext(
      [
        { schoolId: 10, profileId: 3, approvedAt: '2026-01-01' },
        { schoolId: 20, profileId: 1, approvedAt: null },
      ],
      20,
    );
    render(<SchoolSelector />);

    const select = screen.getByRole('combobox', { name: 'Escola ativa' });
    expect(select).toHaveValue('20');
    expect(screen.getByRole('option', { name: 'Escola #10' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Escola #20' })).toBeInTheDocument();
  });

  it('troca a escola ativa ao selecionar outra opção', () => {
    mockContext(
      [
        { schoolId: 10, profileId: 3, approvedAt: '2026-01-01' },
        { schoolId: 20, profileId: 1, approvedAt: null },
      ],
      10,
    );
    render(<SchoolSelector />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Escola ativa' }), {
      target: { value: '20' },
    });

    expect(setActiveSchoolId).toHaveBeenCalledWith(20);
  });

  it('renderiza o seletor mesmo quando ainda não há escola ativa', () => {
    mockContext(
      [
        { schoolId: 10, profileId: 3, approvedAt: '2026-01-01' },
        { schoolId: 20, profileId: 1, approvedAt: null },
      ],
      null,
    );
    render(<SchoolSelector />);

    // O jsdom cai para a primeira opção quando o value não casa com nenhuma;
    // o que importa aqui é que o branch `activeSchoolId ?? ''` foi exercitado.
    const select = screen.getByRole('combobox', { name: 'Escola ativa' });
    expect(select).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
});
