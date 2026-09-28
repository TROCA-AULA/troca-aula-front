import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PrioridadePage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useNetworks } from '@/hooks/useNetworks';
import { useTeacherGroups } from '@/hooks/useEligibility';
import { useTeachers } from '@/hooks/useTeachers';

vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));
vi.mock('@/hooks/useNetworks', () => ({ useNetworks: vi.fn() }));
vi.mock('@/hooks/useEligibility', () => ({ useTeacherGroups: vi.fn() }));
vi.mock('@/hooks/useTeachers', () => ({ useTeachers: vi.fn() }));

const createGroup = vi.fn();
const updateGroup = vi.fn();
const removeGroup = vi.fn();
const setGroupMembers = vi.fn();
const updateSettings = vi.fn();

const data = {
  schoolId: 6,
  ungroupedDelayMinutes: 60,
  fallbackPriorityWindowHours: null,
  allowedNetworkIds: [5],
  acceptedNetworkIds: null,
  groups: [
    { id: 1, name: 'Professores da casa', delayMinutes: 0, professorIds: [17] },
    { id: 2, name: 'Menor prioridade', delayMinutes: 120, professorIds: [] },
  ],
};

describe('PrioridadePage (grupos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 1, name: 'Diretora', email: 'd@e.com', profileId: 1 },
      isLoading: false,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: 6,
      activeProfileId: 1,
      activeNetworkId: 6,
      setActiveSchoolId: vi.fn(),
    } as any);
    vi.mocked(useNetworks).mockReturnValue({
      networks: [{ id: 5, name: 'Rede A', createdAt: '2026-01-01' }],
      loading: false,
      error: null,
      createNetwork: vi.fn(),
      updateNetwork: vi.fn(),
      refetch: vi.fn(),
    } as any);
    vi.mocked(useTeachers).mockReturnValue({
      linkedTeachers: [
        { id: 17, name: 'Maria', email: 'm@e.com', profileId: 3, totalSubstitutions: 0 },
        { id: 18, name: 'João', email: 'j@e.com', profileId: 3, totalSubstitutions: 0 },
      ],
      availableTeachers: [],
      enrollmentRequests: [],
      loading: false,
      error: null,
      fetchLinkedTeachers: vi.fn(),
      fetchAvailableTeachers: vi.fn(),
      fetchEnrollmentRequests: vi.fn(),
      linkTeacher: vi.fn(),
      unlinkTeacher: vi.fn(),
      updateEnrollmentStatus: vi.fn(),
    } as any);
    vi.mocked(useTeacherGroups).mockReturnValue({
      data,
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);
  });

  it('lista os grupos com nome, espera e professores classificados', () => {
    render(<PrioridadePage />);

    expect(screen.getByDisplayValue('Professores da casa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Menor prioridade')).toBeInTheDocument();
    // Maria está no grupo 1 (marcada) e fora do grupo 2; João fora dos dois.
    const mariaCheckboxes = screen.getAllByLabelText('Maria') as HTMLInputElement[];
    expect(mariaCheckboxes[0].checked).toBe(true);
    expect(mariaCheckboxes[1].checked).toBe(false);
    expect((screen.getAllByLabelText('João') as HTMLInputElement[])[0].checked).toBe(false);
  });

  it('cria um grupo novo', async () => {
    createGroup.mockResolvedValue(data);
    render(<PrioridadePage />);

    fireEvent.change(screen.getByLabelText('Novo grupo'), {
      target: { value: 'Novo grupo' },
    });
    fireEvent.change(screen.getAllByLabelText('Espera (minutos)')[2], {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByText('Criar grupo'));

    await waitFor(() =>
      expect(createGroup).toHaveBeenCalledWith('Novo grupo', 30),
    );
  });

  it('salva os professores do grupo', async () => {
    setGroupMembers.mockResolvedValue(data);
    render(<PrioridadePage />);

    fireEvent.click(screen.getAllByLabelText('João')[0]);
    const saveButtons = screen.getAllByText('Salvar professores do grupo');
    fireEvent.click(saveButtons[0]);

    await waitFor(() =>
      expect(setGroupMembers).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([17, 18]),
      ),
    );
  });

  it('salva as configurações da escola (delay padrão e redes aceitas)', async () => {
    updateSettings.mockResolvedValue(data);
    render(<PrioridadePage />);

    fireEvent.change(screen.getByLabelText(/Espera de quem/, { exact: false }), {
      target: { value: '45' },
    });
    fireEvent.click(screen.getByLabelText('Aceitar professores de Rede A'));
    fireEvent.click(screen.getByText('Salvar configurações'));

    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith({
        ungroupedDelayMinutes: 45,
        acceptedNetworkIds: [5],
      }),
    );
  });

  it('mostra estado vazio quando não há grupos', () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: { ...data, groups: [] },
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(screen.getByText(/Nenhum grupo criado/)).toBeInTheDocument();
  });

  it('salva as alterações de nome e espera de um grupo', async () => {
    updateGroup.mockResolvedValue(data);
    render(<PrioridadePage />);

    fireEvent.change(screen.getAllByLabelText('Nome')[0], {
      target: { value: 'Professores da casa (editado)' },
    });
    fireEvent.change(screen.getAllByLabelText('Espera (minutos)')[0], {
      target: { value: '15' },
    });
    fireEvent.click(screen.getAllByText('Salvar grupo')[0]);

    await waitFor(() =>
      expect(updateGroup).toHaveBeenCalledWith(1, {
        name: 'Professores da casa (editado)',
        delayMinutes: 15,
      }),
    );
  });

  it('remove um grupo de prioridade', async () => {
    removeGroup.mockResolvedValue(undefined);
    render(<PrioridadePage />);

    fireEvent.click(screen.getByLabelText('Remover grupo Professores da casa'));

    await waitFor(() => expect(removeGroup).toHaveBeenCalledWith(1));
  });

  it('desmarca um professor do grupo antes de salvar', async () => {
    setGroupMembers.mockResolvedValue(data);
    render(<PrioridadePage />);

    // Maria começa marcada no grupo 1; clicar desmarca.
    fireEvent.click(screen.getAllByLabelText('Maria')[0]);
    fireEvent.click(screen.getAllByText('Salvar professores do grupo')[0]);

    await waitFor(() =>
      expect(setGroupMembers).toHaveBeenCalledWith(1, expect.not.arrayContaining([17])),
    );
  });

  it('mantém a tela estável quando uma ação falha', async () => {
    updateGroup.mockRejectedValue(new Error('falha de rede'));
    render(<PrioridadePage />);

    fireEvent.click(screen.getAllByText('Salvar grupo')[0]);

    await waitFor(() =>
      expect(screen.getAllByText('Salvar grupo')[0]).not.toBeDisabled(),
    );
  });

  it('mostra a janela única com horas quando não há grupos e há fallback configurado', () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: { ...data, groups: [], fallbackPriorityWindowHours: 8 },
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(screen.getByText(/janela única/)).toHaveTextContent('(8h)');
  });

  it('não mostra seção de redes quando o município não configurou interconexão', () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: { ...data, allowedNetworkIds: [] },
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(
      screen.getByText(/nenhuma interconexão configurada pelo município/),
    ).toBeInTheDocument();
  });

  it('usa "Rede #id" quando a rede permitida não está na lista de redes', () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: { ...data, allowedNetworkIds: [5, 99] },
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(screen.getByLabelText('Aceitar professores de Rede A')).toBeInTheDocument();
    expect(screen.getByLabelText('Aceitar professores de Rede #99')).toBeInTheDocument();
  });

  it('avisa quando a escola ainda não tem professores vinculados', () => {
    vi.mocked(useTeachers).mockReturnValue({
      linkedTeachers: [],
      availableTeachers: [],
      enrollmentRequests: [],
      loading: false,
      error: null,
      fetchLinkedTeachers: vi.fn(),
      fetchAvailableTeachers: vi.fn(),
      fetchEnrollmentRequests: vi.fn(),
      linkTeacher: vi.fn(),
      unlinkTeacher: vi.fn(),
      updateEnrollmentStatus: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(
      screen.getAllByText('Nenhum professor vinculado à escola ainda.').length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('salva acceptedNetworkIds como null quando nenhuma rede é aceita', async () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: { ...data, acceptedNetworkIds: [5] },
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);
    updateSettings.mockResolvedValue(data);

    render(<PrioridadePage />);

    // Começa marcada (acceptedNetworkIds [5]); clicar desmarca.
    fireEvent.click(screen.getByLabelText('Aceitar professores de Rede A'));
    fireEvent.click(screen.getByText('Salvar configurações'));

    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith({
        ungroupedDelayMinutes: 60,
        acceptedNetworkIds: null,
      }),
    );
  });

  it('mostra o modo de janela única quando os dados ainda não chegaram', () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: null,
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(screen.getByText(/Nenhum grupo criado/)).toBeInTheDocument();
  });

  it('pede para selecionar uma escola quando não há escola ativa', () => {
    vi.mocked(useSchoolContext).mockReturnValue({
      user: { id: 1, name: 'Diretora', email: 'd@e.com', profileId: 1 },
      isLoading: false,
      logout: vi.fn(),
      refreshUserData: vi.fn(),
      schoolLinks: [],
      activeSchoolId: null,
      activeProfileId: 1,
      activeNetworkId: null,
      setActiveSchoolId: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(
      screen.getByText('Selecione uma escola para configurar a prioridade.'),
    ).toBeInTheDocument();
  });

  it('mostra o carregando dos grupos de prioridade', () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: null,
      loading: true,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  });
});
