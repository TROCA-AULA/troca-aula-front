import { render, screen, fireEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationBell } from './NotificationBell';
import { useNotifications } from '@/hooks/useNotifications';

vi.mock('@/hooks/useNotifications', () => ({ useNotifications: vi.fn() }));

const markAllAsRead = vi.fn();

const notifications = [
  {
    id: 'class-1',
    type: 'NEW_VACANCY' as const,
    title: 'Nova aula vaga',
    description: 'Matemática · Escola A',
    createdAt: '2026-10-01T11:30:00.000Z',
    href: '/classes',
  },
  {
    id: 'enrollment-2',
    type: 'ENROLLMENT_DECIDED' as const,
    title: 'Candidatura aprovada',
    description: 'Aula #42',
    createdAt: '2026-10-01T09:00:00.000Z',
    href: '/minhas-aulas',
  },
];

function mockNotifications(overrides: Record<string, unknown> = {}) {
  vi.mocked(useNotifications).mockReturnValue({
    notifications,
    unreadCount: 2,
    loading: false,
    markAllAsRead,
    refetch: vi.fn(),
    ...overrides,
  } as any);
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra o badge com a contagem de não lidas', () => {
    render(<NotificationBell />);

    expect(screen.getByTestId('notification-badge')).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Notificações' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('não mostra o badge quando não há novidades', () => {
    mockNotifications({ unreadCount: 0 });
    render(<NotificationBell />);

    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  it('abre o dropdown, marca tudo como lido e fecha ao clicar de novo', () => {
    render(<NotificationBell />);

    const bell = screen.getByRole('button', { name: 'Notificações' });
    fireEvent.click(bell);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(bell).toHaveAttribute('aria-expanded', 'true');
    expect(markAllAsRead).toHaveBeenCalledTimes(1);

    fireEvent.click(bell);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(bell).toHaveAttribute('aria-expanded', 'false');
    // Fechar não marca de novo.
    expect(markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('mostra o estado vazio quando não há notificações', () => {
    mockNotifications({ notifications: [], unreadCount: 0 });
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));

    expect(screen.getByText('Nenhuma novidade por aqui.')).toBeInTheDocument();
  });

  it('lista as notificações com título, descrição e link', () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));

    expect(screen.getByText('Nova aula vaga')).toBeInTheDocument();
    expect(screen.getByText('Matemática · Escola A')).toBeInTheDocument();
    expect(screen.getByText('Candidatura aprovada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nova aula vaga/ })).toHaveAttribute(
      'href',
      '/classes',
    );
    expect(screen.getByRole('link', { name: /Candidatura aprovada/ })).toHaveAttribute(
      'href',
      '/minhas-aulas',
    );
  });

  it('fecha o dropdown ao clicar em uma notificação', () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));
    fireEvent.click(screen.getByRole('link', { name: /Nova aula vaga/ }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('fecha o dropdown ao clicar fora', () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('formata o tempo relativo de cada notificação', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T12:00:00.000Z'));
    mockNotifications({
      notifications: [
        { ...notifications[0], id: 'a', createdAt: '2026-10-01T11:59:30.000Z' },
        { ...notifications[0], id: 'b', createdAt: '2026-10-01T11:30:00.000Z' },
        { ...notifications[0], id: 'c', createdAt: '2026-10-01T08:00:00.000Z' },
        { ...notifications[0], id: 'd', createdAt: '2026-09-29T12:00:00.000Z' },
      ],
    });
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));

    expect(screen.getByText('agora')).toBeInTheDocument();
    expect(screen.getByText('30 min atrás')).toBeInTheDocument();
    expect(screen.getByText('4 h atrás')).toBeInTheDocument();
    expect(screen.getByText('2 d atrás')).toBeInTheDocument();
  });
});
