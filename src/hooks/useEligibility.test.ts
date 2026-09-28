import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useProfessorPreferences,
  useTeacherGroups,
  useInterconnections,
} from '@/hooks/useEligibility';
import {
  eligibilityService,
  type TeacherGroupsResponse,
  type ProfessorPreferencesResponse,
  type NetworkInterconnectionsResponse,
} from '@/services/eligibility.service';
import { toast } from 'react-toastify';

vi.mock('@/services/eligibility.service', () => ({
  eligibilityService: {
    getMyPreferences: vi.fn(),
    addNetworkInterest: vi.fn(),
    removeNetworkInterest: vi.fn(),
    addSchoolExclusion: vi.fn(),
    removeSchoolExclusion: vi.fn(),
    getTeacherGroups: vi.fn(),
    createTeacherGroup: vi.fn(),
    updateTeacherGroup: vi.fn(),
    removeTeacherGroup: vi.fn(),
    setTeacherGroupMembers: vi.fn(),
    updatePrioritySettings: vi.fn(),
    getInterconnections: vi.fn(),
    setInterconnections: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const emptyPreferences: ProfessorPreferencesResponse = {
  networkInterests: [],
  schoolExclusions: [],
};

const teacherGroupsResponse = (
  overrides: Partial<TeacherGroupsResponse> = {},
): TeacherGroupsResponse => ({
  schoolId: 6,
  ungroupedDelayMinutes: 60,
  fallbackPriorityWindowHours: null,
  allowedNetworkIds: [5],
  acceptedNetworkIds: null,
  groups: [
    { id: 1, name: 'Professores da casa', delayMinutes: 0, professorIds: [17] },
  ],
  ...overrides,
});

const interconnectionsResponse = (
  interconnections: NetworkInterconnectionsResponse['interconnections'] = [],
): NetworkInterconnectionsResponse => ({ networkId: 6, interconnections });

describe('useProfessorPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia em loading e carrega as preferências', async () => {
    let resolvePreferences!: (value: ProfessorPreferencesResponse) => void;
    vi.mocked(eligibilityService.getMyPreferences).mockReturnValue(
      new Promise((resolve) => {
        resolvePreferences = resolve;
      }),
    );

    const { result } = renderHook(() => useProfessorPreferences());

    expect(result.current.loading).toBe(true);
    expect(result.current.preferences).toEqual(emptyPreferences);

    await act(async () => {
      resolvePreferences(emptyPreferences);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.preferences).toEqual(emptyPreferences);
  });

  it('mostra toast de erro quando o carregamento falha', async () => {
    vi.mocked(eligibilityService.getMyPreferences).mockRejectedValue(
      new Error('indisponível'),
    );

    renderHook(() => useProfessorPreferences());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao carregar suas preferências'),
    );
  });

  it('adiciona e remove interesses e exclusões atualizando o estado', async () => {
    const afterAddNetwork: ProfessorPreferencesResponse = {
      networkInterests: [{ networkId: 5, networkName: 'Rede A' }],
      schoolExclusions: [],
    };
    const afterAddExclusion: ProfessorPreferencesResponse = {
      networkInterests: [],
      schoolExclusions: [{ schoolId: 9, schoolName: 'Escola X' }],
    };

    vi.mocked(eligibilityService.getMyPreferences)
      .mockResolvedValueOnce(emptyPreferences)
      .mockResolvedValueOnce(afterAddNetwork)
      .mockResolvedValueOnce(emptyPreferences)
      .mockResolvedValueOnce(afterAddExclusion)
      .mockResolvedValueOnce(emptyPreferences);
    vi.mocked(eligibilityService.addNetworkInterest).mockResolvedValue();
    vi.mocked(eligibilityService.removeNetworkInterest).mockResolvedValue();
    vi.mocked(eligibilityService.addSchoolExclusion).mockResolvedValue();
    vi.mocked(eligibilityService.removeSchoolExclusion).mockResolvedValue();

    const { result } = renderHook(() => useProfessorPreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addNetworkInterest(5);
    });
    expect(eligibilityService.addNetworkInterest).toHaveBeenCalledWith(5);
    expect(toast.success).toHaveBeenCalledWith('Interesse registrado');
    expect(result.current.preferences).toEqual(afterAddNetwork);

    await act(async () => {
      await result.current.removeNetworkInterest(5);
    });
    expect(eligibilityService.removeNetworkInterest).toHaveBeenCalledWith(5);
    expect(toast.success).toHaveBeenCalledWith('Interesse removido');
    expect(result.current.preferences).toEqual(emptyPreferences);

    await act(async () => {
      await result.current.addSchoolExclusion(9);
    });
    expect(eligibilityService.addSchoolExclusion).toHaveBeenCalledWith(9);
    expect(toast.success).toHaveBeenCalledWith('Escola excluída das suas vagas');
    expect(result.current.preferences).toEqual(afterAddExclusion);

    await act(async () => {
      await result.current.removeSchoolExclusion(9);
    });
    expect(eligibilityService.removeSchoolExclusion).toHaveBeenCalledWith(9);
    expect(toast.success).toHaveBeenCalledWith('Exclusão removida');
    expect(result.current.preferences).toEqual(emptyPreferences);

    // 1 carga inicial + 1 refetch por mutação.
    expect(eligibilityService.getMyPreferences).toHaveBeenCalledTimes(5);
  });
});

describe('useTeacherGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não busca nada e ignora as mutações quando schoolId é nulo', async () => {
    const { result } = renderHook(() => useTeacherGroups(null));

    expect(eligibilityService.getTeacherGroups).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();

    await act(async () => {
      expect(await result.current.createGroup('Novo grupo', 30)).toBeUndefined();
      expect(await result.current.updateGroup(1, { name: 'Renomeado' })).toBeUndefined();
      expect(await result.current.removeGroup(1)).toBeUndefined();
      expect(await result.current.setGroupMembers(1, [17])).toBeUndefined();
      expect(
        await result.current.updateSettings({ ungroupedDelayMinutes: 5 }),
      ).toBeUndefined();
      await result.current.refetch();
    });

    expect(eligibilityService.createTeacherGroup).not.toHaveBeenCalled();
    expect(eligibilityService.updateTeacherGroup).not.toHaveBeenCalled();
    expect(eligibilityService.removeTeacherGroup).not.toHaveBeenCalled();
    expect(eligibilityService.setTeacherGroupMembers).not.toHaveBeenCalled();
    expect(eligibilityService.updatePrioritySettings).not.toHaveBeenCalled();
  });

  it('inicia em loading e carrega os grupos quando schoolId é informado', async () => {
    const data = teacherGroupsResponse();
    let resolveGroups!: (value: TeacherGroupsResponse) => void;
    vi.mocked(eligibilityService.getTeacherGroups).mockReturnValue(
      new Promise((resolve) => {
        resolveGroups = resolve;
      }),
    );

    const { result } = renderHook(() => useTeacherGroups(6));

    expect(result.current.loading).toBe(true);
    expect(eligibilityService.getTeacherGroups).toHaveBeenCalledWith(6);

    await act(async () => {
      resolveGroups(data);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(data);
  });

  it('mostra toast de erro quando o carregamento falha', async () => {
    vi.mocked(eligibilityService.getTeacherGroups).mockRejectedValue(
      new Error('falhou'),
    );

    renderHook(() => useTeacherGroups(6));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao carregar os grupos de prioridade',
      ),
    );
  });

  it('executa as mutações atualizando os dados e retornando o resultado', async () => {
    const base = teacherGroupsResponse();
    const created = teacherGroupsResponse({
      groups: [
        ...base.groups,
        { id: 2, name: 'Novo grupo', delayMinutes: 30, professorIds: [] },
      ],
    });
    const updated = teacherGroupsResponse({
      groups: [{ ...base.groups[0], name: 'Renomeado' }],
    });
    const removed = teacherGroupsResponse({ groups: [] });
    const membersSet = teacherGroupsResponse({
      groups: [{ ...base.groups[0], professorIds: [17, 18] }],
    });
    const settingsUpdated = teacherGroupsResponse({ ungroupedDelayMinutes: 45 });

    vi.mocked(eligibilityService.getTeacherGroups).mockResolvedValue(base);
    vi.mocked(eligibilityService.createTeacherGroup).mockResolvedValue(created);
    vi.mocked(eligibilityService.updateTeacherGroup).mockResolvedValue(updated);
    vi.mocked(eligibilityService.removeTeacherGroup).mockResolvedValue(removed);
    vi.mocked(eligibilityService.setTeacherGroupMembers).mockResolvedValue(membersSet);
    vi.mocked(eligibilityService.updatePrioritySettings).mockResolvedValue(
      settingsUpdated,
    );

    const { result } = renderHook(() => useTeacherGroups(6));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(base);

    await act(async () => {
      expect(await result.current.createGroup('Novo grupo', 30)).toEqual(created);
    });
    expect(eligibilityService.createTeacherGroup).toHaveBeenCalledWith(6, {
      name: 'Novo grupo',
      delayMinutes: 30,
    });
    expect(toast.success).toHaveBeenCalledWith('Grupo criado');
    expect(result.current.data).toEqual(created);

    await act(async () => {
      expect(await result.current.updateGroup(2, { delayMinutes: 15 })).toEqual(
        updated,
      );
    });
    expect(eligibilityService.updateTeacherGroup).toHaveBeenCalledWith(6, 2, {
      delayMinutes: 15,
    });
    expect(toast.success).toHaveBeenCalledWith('Grupo atualizado');
    expect(result.current.data).toEqual(updated);

    await act(async () => {
      expect(await result.current.removeGroup(2)).toEqual(removed);
    });
    expect(eligibilityService.removeTeacherGroup).toHaveBeenCalledWith(6, 2);
    expect(toast.success).toHaveBeenCalledWith('Grupo removido');
    expect(result.current.data).toEqual(removed);

    await act(async () => {
      expect(await result.current.setGroupMembers(1, [17, 18])).toEqual(membersSet);
    });
    expect(eligibilityService.setTeacherGroupMembers).toHaveBeenCalledWith(6, 1, [
      17, 18,
    ]);
    expect(toast.success).toHaveBeenCalledWith('Professores do grupo atualizados');
    expect(result.current.data).toEqual(membersSet);

    await act(async () => {
      expect(
        await result.current.updateSettings({
          ungroupedDelayMinutes: 45,
          acceptedNetworkIds: [5],
        }),
      ).toEqual(settingsUpdated);
    });
    expect(eligibilityService.updatePrioritySettings).toHaveBeenCalledWith(6, {
      ungroupedDelayMinutes: 45,
      acceptedNetworkIds: [5],
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Configurações de prioridade atualizadas',
    );
    expect(result.current.data).toEqual(settingsUpdated);
  });

  it('repropaga erros das mutações sem toast de sucesso', async () => {
    vi.mocked(eligibilityService.getTeacherGroups).mockResolvedValue(
      teacherGroupsResponse(),
    );
    vi.mocked(eligibilityService.createTeacherGroup).mockRejectedValue(
      new Error('sem permissão'),
    );

    const { result } = renderHook(() => useTeacherGroups(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.createGroup('X', 1)).rejects.toThrow(
        'sem permissão',
      );
    });

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('refaz a busca ao chamar refetch manualmente', async () => {
    vi.mocked(eligibilityService.getTeacherGroups).mockResolvedValue(
      teacherGroupsResponse(),
    );

    const { result } = renderHook(() => useTeacherGroups(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(eligibilityService.getTeacherGroups).toHaveBeenCalledTimes(2);
  });
});

describe('useInterconnections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('limpa os dados quando networkId é nulo e ignora o save', async () => {
    const { result } = renderHook(() => useInterconnections(null));

    expect(eligibilityService.getInterconnections).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);

    await act(async () => {
      expect(await result.current.save([5])).toBeUndefined();
    });

    expect(eligibilityService.setInterconnections).not.toHaveBeenCalled();
  });

  it('carrega as interconexões e volta a buscar quando networkId muda', async () => {
    const loaded = interconnectionsResponse([
      { networkId: 5, networkName: 'Rede A' },
    ]);
    vi.mocked(eligibilityService.getInterconnections).mockResolvedValue(loaded);

    const { result, rerender } = renderHook(
      ({ id }: { id: number | null }) => useInterconnections(id),
      { initialProps: { id: null as number | null } },
    );

    expect(result.current.data).toBeNull();
    expect(eligibilityService.getInterconnections).not.toHaveBeenCalled();

    rerender({ id: 6 });

    await waitFor(() => expect(result.current.data).toEqual(loaded));
    expect(eligibilityService.getInterconnections).toHaveBeenCalledWith(6);
    expect(result.current.loading).toBe(false);
  });

  it('mostra toast de erro quando o carregamento falha', async () => {
    vi.mocked(eligibilityService.getInterconnections).mockRejectedValue(
      new Error('falhou'),
    );

    renderHook(() => useInterconnections(6));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao carregar as interconexões'),
    );
  });

  it('salva as interconexões atualizando os dados', async () => {
    const initial = interconnectionsResponse();
    const updated = interconnectionsResponse([
      { networkId: 5, networkName: 'Rede A' },
    ]);
    vi.mocked(eligibilityService.getInterconnections).mockResolvedValue(initial);
    vi.mocked(eligibilityService.setInterconnections).mockResolvedValue(updated);

    const { result } = renderHook(() => useInterconnections(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      expect(await result.current.save([5])).toEqual(updated);
    });

    expect(eligibilityService.setInterconnections).toHaveBeenCalledWith(6, [5]);
    expect(toast.success).toHaveBeenCalledWith('Interconexões atualizadas');
    expect(result.current.data).toEqual(updated);
  });

  it('repropaga erro do save', async () => {
    vi.mocked(eligibilityService.getInterconnections).mockResolvedValue(
      interconnectionsResponse(),
    );
    vi.mocked(eligibilityService.setInterconnections).mockRejectedValue(
      new Error('sem permissão'),
    );

    const { result } = renderHook(() => useInterconnections(6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.save([5])).rejects.toThrow('sem permissão');
    });

    expect(toast.success).not.toHaveBeenCalled();
  });
});
