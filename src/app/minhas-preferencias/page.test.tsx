import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MinhasPreferenciasPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useNetworks } from '@/hooks/useNetworks';
import { useProfessorPreferences } from '@/hooks/useEligibility';
import { schoolsService } from '@/services/schools.service';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/hooks/useNetworks', () => ({
  useNetworks: vi.fn(),
}));

vi.mock('@/hooks/useEligibility', () => ({
  useProfessorPreferences: vi.fn(),
}));

vi.mock('@/services/schools.service', () => ({
  schoolsService: { getSchools: vi.fn(), getSchool: vi.fn() },
}));

const addNetworkInterest = vi.fn();
const removeNetworkInterest = vi.fn();
const addSchoolExclusion = vi.fn();
const removeSchoolExclusion = vi.fn();

describe('MinhasPreferenciasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 7, name: 'Professor', email: 'p@e.com', profileId: 3 },
      isLoading: false,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: 1,
      activeProfileId: 3,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    } as any);
    vi.mocked(useNetworks).mockReturnValue({
      networks: [
        { id: 1, name: 'Rede A', createdAt: '2026-01-01' },
        { id: 2, name: 'Rede B', createdAt: '2026-01-02' },
      ],
      loading: false,
      error: null,
      createNetwork: vi.fn(),
      updateNetwork: vi.fn(),
      refetch: vi.fn(),
    } as any);
    vi.mocked(useProfessorPreferences).mockReturnValue({
      preferences: {
        networkInterests: [{ networkId: 2, networkName: 'Rede B' }],
        schoolExclusions: [{ schoolId: 9, schoolName: 'Escola X' }],
      },
      loading: false,
      addNetworkInterest,
      removeNetworkInterest,
      addSchoolExclusion,
      removeSchoolExclusion,
    } as any);
    vi.mocked(schoolsService.getSchools).mockResolvedValue([
      { id: 9, name: 'Escola X' },
      { id: 10, name: 'Escola Y' },
    ] as any);
  });

  it('lista interesses e exclusões atuais', async () => {
    render(<MinhasPreferenciasPage />);

    expect(screen.getByText('Rede B')).toBeInTheDocument();
    expect(screen.getByText('Escola X')).toBeInTheDocument();
    await waitFor(() => expect(schoolsService.getSchools).toHaveBeenCalled());
  });

  it('adiciona um interesse de rede', async () => {
    render(<MinhasPreferenciasPage />);

    fireEvent.change(screen.getByLabelText('Rede'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Adicionar interesse'));

    await waitFor(() => expect(addNetworkInterest).toHaveBeenCalledWith(1));
  });

  it('exclui uma escola', async () => {
    render(<MinhasPreferenciasPage />);

    await waitFor(() => expect(schoolsService.getSchools).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('Escola'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Excluir escola'));

    await waitFor(() => expect(addSchoolExclusion).toHaveBeenCalledWith(10));
  });

  it('remove um interesse existente', async () => {
    render(<MinhasPreferenciasPage />);

    fireEvent.click(screen.getAllByText('remover')[0]);

    await waitFor(() => expect(removeNetworkInterest).toHaveBeenCalledWith(2));
  });
});
