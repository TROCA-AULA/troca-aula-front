import { render, screen, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MinhaJornadaPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useMyWorkloadRecords } from '@/hooks/useMyWorkloadRecords';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/hooks/useMyWorkloadRecords', () => ({
  useMyWorkloadRecords: vi.fn(),
}));

describe('MinhaJornadaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to the login page when there is no session', () => {
    vi.mocked(useSchoolContext).mockReturnValue({ user: null, isLoading: false } as any);
    vi.mocked(useMyWorkloadRecords).mockReturnValue({
      records: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MinhaJornadaPage />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should show an empty state when the professor has no records yet', async () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 3, name: 'Professor Carlos', profileId: 3 },
      isLoading: false,
    } as any);
    vi.mocked(useMyWorkloadRecords).mockReturnValue({
      records: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MinhaJornadaPage />);

    await waitFor(() => {
      expect(screen.getByText(/nenhum registro de jornada/i)).toBeInTheDocument();
    });
  });

  it('should list records with the school name when populated', async () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 3, name: 'Professor Carlos', profileId: 3 },
      isLoading: false,
    } as any);
    vi.mocked(useMyWorkloadRecords).mockReturnValue({
      records: [
        {
          id: 1,
          userId: 3,
          schoolId: 1,
          networkId: 1,
          workloadTypeId: 4,
          hours: '6',
          ataOficialRef: 'ATA-2026-045',
          validFrom: '2026-10-01',
          validTo: null,
          createdById: 1,
          createdAt: '2026-10-01T00:00:00Z',
          school: { id: 1, name: 'Escola Bootstrap' },
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MinhaJornadaPage />);

    await waitFor(() => {
      expect(screen.getByText('Escola Bootstrap')).toBeInTheDocument();
      expect(screen.getByText('ATA-2026-045')).toBeInTheDocument();
    });
  });

  it('should fall back to a numeric label when the school is not populated', async () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 3, name: 'Professor Carlos', profileId: 3 },
      isLoading: false,
    } as any);
    vi.mocked(useMyWorkloadRecords).mockReturnValue({
      records: [
        {
          id: 2,
          userId: 3,
          schoolId: 7,
          networkId: 1,
          workloadTypeId: 1,
          hours: '4',
          ataOficialRef: null,
          validFrom: '2026-10-01',
          validTo: null,
          createdById: 1,
          createdAt: '2026-10-01T00:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MinhaJornadaPage />);

    await waitFor(() => {
      expect(screen.getByText('Escola #7')).toBeInTheDocument();
    });
  });
});
