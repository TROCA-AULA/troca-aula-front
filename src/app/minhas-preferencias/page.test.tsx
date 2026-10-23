import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MinhasPreferenciasPage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useProfessorPreferences } from '@/hooks/useEligibility';
import { eligibilityService } from '@/services/eligibility.service';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/contexts/SchoolContext', () => ({
  useSchoolContext: vi.fn(),
}));

vi.mock('@/hooks/useEligibility', () => ({
  useProfessorPreferences: vi.fn(),
}));

vi.mock('@/services/eligibility.service', () => ({
  eligibilityService: { getPreferenceOptions: vi.fn() },
}));

const addNetworkInterest = vi.fn();
const removeNetworkInterest = vi.fn();
const addSchoolExclusion = vi.fn();
const removeSchoolExclusion = vi.fn();
const setResidence = vi.fn();

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
      setResidence,
    } as any);
    // Inclui rede e escola de OUTRO município (defeito D5).
    vi.mocked(eligibilityService.getPreferenceOptions).mockResolvedValue({
      networks: [
        { id: 1, name: 'Rede A' },
        { id: 2, name: 'Rede B' },
      ],
      schools: [
        { id: 9, name: 'Escola X', networkId: 1 },
        { id: 10, name: 'Escola Y', networkId: 2 },
      ],
    });
  });

  it('lista interesses e exclusões atuais', async () => {
    render(<MinhasPreferenciasPage />);

    expect(screen.getByText('Rede B')).toBeInTheDocument();
    expect(screen.getByText('Escola X')).toBeInTheDocument();
    await waitFor(() => expect(eligibilityService.getPreferenceOptions).toHaveBeenCalled());
  });

  it('adiciona um interesse de rede', async () => {
    render(<MinhasPreferenciasPage />);

    await screen.findAllByRole('option', { name: 'Rede A' });
    fireEvent.change(screen.getByLabelText('Rede'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Adicionar interesse'));

    await waitFor(() => expect(addNetworkInterest).toHaveBeenCalledWith(1));
  });

  it('exclui uma escola', async () => {
    render(<MinhasPreferenciasPage />);

    await screen.findByRole('option', { name: 'Escola Y' });
    fireEvent.change(screen.getByLabelText('Escola'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Excluir escola'));

    await waitFor(() => expect(addSchoolExclusion).toHaveBeenCalledWith(10));
  });

  it('remove um interesse existente', async () => {
    render(<MinhasPreferenciasPage />);

    fireEvent.click(screen.getAllByText('remover')[0]);

    await waitFor(() => expect(removeNetworkInterest).toHaveBeenCalledWith(2));
  });

  describe('onde mora', () => {
    const withPrefs = (extra: object) =>
      vi.mocked(useProfessorPreferences).mockReturnValue({
        preferences: { networkInterests: [], schoolExclusions: [], ...extra },
        loading: false,
        addNetworkInterest,
        removeNetworkInterest,
        addSchoolExclusion,
        removeSchoolExclusion,
        setResidence,
      } as any);

    it('sem contrato: explica que a residência conta e salva a escolha', async () => {
      withPrefs({ hasContract: false, residenceNetworkId: null });
      setResidence.mockResolvedValue(undefined);
      render(<MinhasPreferenciasPage />);

      expect(screen.getByText(/o município onde você mora conta como a sua rede/)).toBeInTheDocument();
      const button = screen.getByRole('button', { name: 'Salvar município' });
      expect(button).toBeDisabled();

      await screen.findAllByRole('option', { name: 'Rede A' });
      fireEvent.change(screen.getByLabelText('Município onde mora'), {
        target: { value: '1' },
      });
      expect(button).toBeEnabled();
      fireEvent.click(button);

      await waitFor(() => expect(setResidence).toHaveBeenCalledWith(7, 1));
    });

    it('com contrato: avisa que o contrato prevalece e permite limpar', async () => {
      withPrefs({ hasContract: true, residenceNetworkId: 2, residenceNetworkName: 'Rede B' });
      setResidence.mockRejectedValue(new Error('400'));
      render(<MinhasPreferenciasPage />);

      expect(screen.getByText(/o contrato vale mais que a residência/)).toBeInTheDocument();
      await screen.findAllByRole('option', { name: 'Rede B' });
      const select = screen.getByLabelText('Município onde mora') as HTMLSelectElement;
      expect(select.value).toBe('2');

      fireEvent.change(select, { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar município' }));
      await waitFor(() => expect(setResidence).toHaveBeenCalledWith(7, null));
      // Erro: o interceptor já avisou; a página continua utilizável.
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Salvar município' })).toBeEnabled(),
      );
    });
  });
});

describe('MinhasPreferenciasPage — falha ao carregar opções', () => {
  it('mostra listas vazias sem quebrar', async () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 7, name: 'Professor', email: 'p@e.com', profileId: 3 },
      isLoading: false,
    } as any);
    vi.mocked(useProfessorPreferences).mockReturnValue({
      preferences: { networkInterests: [], schoolExclusions: [] },
      loading: false,
    } as any);
    vi.mocked(eligibilityService.getPreferenceOptions).mockRejectedValue(
      new Error('x'),
    );

    render(<MinhasPreferenciasPage />);

    await waitFor(() =>
      expect(eligibilityService.getPreferenceOptions).toHaveBeenCalled(),
    );
    expect(screen.queryByRole('option', { name: 'Rede A' })).toBeNull();
  });

});
