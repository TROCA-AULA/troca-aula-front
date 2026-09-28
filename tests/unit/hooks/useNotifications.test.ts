import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { enrollmentService } from '@/services/enrollment.service';
import { PROFILE } from '@/constants/profile';

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/services/enrollment.service', () => ({
  enrollmentService: {
    getAvailableClasses: vi.fn(),
    getEnrollments: vi.fn(),
  },
}));

const NOW = new Date().toISOString();
const RECENT = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h atrás
const OLD = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60d atrás

function mockUser(profileId: number) {
  vi.mocked(useSchoolContext).mockReturnValue({
    user: { id: 7, name: 'Test', email: 't@t.com', profileId },
    isLoading: false,
    logout: vi.fn(),
    refreshUserData: vi.fn(),
    schoolLinks: [],
    activeSchoolId: null,
    activeProfileId: profileId,
    activeNetworkId: null,
    setActiveSchoolId: vi.fn(),
  } as any);
}

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('monta vagas novas e decisões recentes para o professor', async () => {
    mockUser(PROFILE.PROFESSOR);
    vi.mocked(enrollmentService.getAvailableClasses).mockResolvedValue([
      {
        id: 10,
        subjectId: 1,
        statededAt: RECENT,
        available: true,
        createdAt: RECENT,
        subject: { id: 1, name: 'Matemática' },
        school: { id: 2, name: 'Escola A' },
      },
    ]);
    vi.mocked(enrollmentService.getEnrollments).mockResolvedValue([
      {
        id: 5,
        classId: 10,
        professorId: 7,
        status: 'APPROVED',
        createdAt: OLD,
        updatedAt: RECENT,
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    const types = result.current.notifications.map((n) => n.type);
    expect(types).toContain('NEW_VACANCY');
    expect(types).toContain('ENROLLMENT_DECIDED');

    const vacancy = result.current.notifications.find((n) => n.type === 'NEW_VACANCY')!;
    expect(vacancy.description).toBe('Matemática · Escola A');
    expect(vacancy.href).toBe('/classes');

    const decided = result.current.notifications.find((n) => n.type === 'ENROLLMENT_DECIDED')!;
    expect(decided.title).toBe('Candidatura aprovada');
    expect(decided.href).toBe('/minhas-aulas');
  });

  it('ignora itens fora da janela de 30 dias', async () => {
    mockUser(PROFILE.PROFESSOR);
    vi.mocked(enrollmentService.getAvailableClasses).mockResolvedValue([
      {
        id: 11,
        subjectId: 1,
        statededAt: OLD,
        available: true,
        createdAt: OLD,
      },
    ]);
    vi.mocked(enrollmentService.getEnrollments).mockResolvedValue([]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.notifications).toHaveLength(0));
  });

  it('conta como não lido só o que chegou depois do lastSeen e marca tudo como lido', async () => {
    mockUser(PROFILE.PROFESSOR);
    // lastSeen de 2h atrás: a vaga de 1h atrás conta como não lida.
    window.localStorage.setItem(
      'troca-aula:notificationsSeenAt:7',
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    );
    vi.mocked(enrollmentService.getAvailableClasses).mockResolvedValue([
      {
        id: 12,
        subjectId: 1,
        statededAt: RECENT,
        available: true,
        createdAt: RECENT,
        subject: { id: 1, name: 'Física' },
      },
    ]);
    vi.mocked(enrollmentService.getEnrollments).mockResolvedValue([]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(window.localStorage.getItem('troca-aula:notificationsSeenAt:7')).not.toBeNull();
  });

  it('lista candidaturas pendentes para o MASTER', async () => {
    mockUser(PROFILE.MASTER);
    vi.mocked(enrollmentService.getEnrollments).mockResolvedValue([
      {
        id: 9,
        classId: 3,
        professorId: 4,
        status: 'PENDING',
        createdAt: NOW,
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
    expect(result.current.notifications[0].type).toBe('PENDING_ENROLLMENT');
    expect(result.current.notifications[0].href).toBe('/master/professores');
  });
});
