import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PrioridadePage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useTeacherGroups } from '@/hooks/useEligibility';
import { useTeachers } from '@/hooks/useTeachers';

vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));
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
  ungroupedEffectiveDelayMinutes: 120,
  allowedNetworkIds: [5],
  allowedNetworks: [{ id: 5, name: 'Rede A' }],
  acceptedNetworkIds: null,
  // Vem fora de ordem de propósito: a tela ordena por prioridade.
  groups: [
    { id: 2, name: 'Menor prioridade', priority: 1, delayMinutes: 120, professorIds: [] },
    { id: 1, name: 'Professores da casa', priority: 0, delayMinutes: 0, professorIds: [17] },
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
    // No grupo 2 o rótulo de Maria ganha "(também em Professores da casa)".
    const mariaCheckboxes = screen.getAllByLabelText(/^Maria/) as HTMLInputElement[];
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

    // Prioridade em branco = o backend põe depois do último grupo.
    await waitFor(() =>
      expect(createGroup).toHaveBeenCalledWith('Novo grupo', 30, undefined),
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

    fireEvent.change(screen.getByLabelText(/Espera mínima de quem/), {
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
    expect(screen.getByText(/Esta escola não tem grupos/)).toBeInTheDocument();
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
    fireEvent.change(screen.getAllByLabelText('Prioridade')[0], {
      target: { value: '2' },
    });
    fireEvent.click(screen.getAllByText('Salvar grupo')[0]);

    await waitFor(() =>
      expect(updateGroup).toHaveBeenCalledWith(1, {
        name: 'Professores da casa (editado)',
        priority: 2,
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

  it('mostra a ordem de recebimento: prioridade 0 primeiro e sem grupo por último', () => {
    render(<PrioridadePage />);

    const items = screen
      .getByRole('list', { name: 'Ordem de recebimento' })
      .querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Professores da casa — vê na hora');
    expect(items[1]).toHaveTextContent('Menor prioridade — vê 2h depois de publicada');
    // João (18) não está em grupo nenhum.
    expect(items[2]).toHaveTextContent(
      'Sem grupo — vê 2h depois de publicada (1 professor(es) desta escola)',
    );
  });

  it('calcula a espera de quem está sem grupo quando o backend não manda', () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: {
        ...data,
        ungroupedEffectiveDelayMinutes: undefined,
        ungroupedDelayMinutes: 0,
        groups: [
          { id: 1, name: 'Casa', priority: 0, delayMinutes: 0, professorIds: [] },
        ],
      },
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    const items = screen
      .getByRole('list', { name: 'Ordem de recebimento' })
      .querySelectorAll('li');
    expect(items[1]).toHaveTextContent(
      'vê na hora (2 professor(es) desta escola)',
    );
  });

  it('cria grupo com prioridade escolhida', async () => {
    createGroup.mockResolvedValue(data);
    render(<PrioridadePage />);

    fireEvent.change(screen.getByLabelText('Novo grupo'), {
      target: { value: 'Urgente' },
    });
    fireEvent.change(screen.getAllByLabelText('Prioridade')[2], {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByText('Criar grupo'));

    await waitFor(() =>
      expect(createGroup).toHaveBeenCalledWith('Urgente', 0, 0),
    );
  });

  it('avisa quando o professor está em mais de um grupo', () => {
    vi.mocked(useTeacherGroups).mockReturnValue({
      data: {
        ...data,
        groups: [
          { id: 1, name: 'Casa', priority: 0, delayMinutes: 0, professorIds: [17] },
          { id: 2, name: 'Rede', priority: 1, delayMinutes: 30, professorIds: [17] },
        ],
      },
      loading: false,
      createGroup,
      updateGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
      refetch: vi.fn(),
    } as any);

    render(<PrioridadePage />);

    expect(screen.getByText(/também em Rede/)).toBeInTheDocument();
    expect(screen.getByText(/também em Casa/)).toBeInTheDocument();
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

  it('usa "Rede #id" quando a rede permitida vem sem nome', () => {
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

  it('mostra "sem grupos" quando os dados ainda não chegaram', () => {
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
