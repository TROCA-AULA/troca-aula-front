import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  eligibilityService,
  NetworkInterconnectionsResponse,
  ProfessorPreferencesResponse,
  TeacherGroupsResponse,
} from '@/services/eligibility.service';

export function useProfessorPreferences() {
  const [preferences, setPreferences] = useState<ProfessorPreferencesResponse>({
    networkInterests: [],
    schoolExclusions: [],
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setPreferences(await eligibilityService.getMyPreferences());
    } catch {
      toast.error('Erro ao carregar suas preferências');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addNetworkInterest = async (networkId: number) => {
    await eligibilityService.addNetworkInterest(networkId);
    toast.success('Interesse registrado');
    await refetch();
  };

  const removeNetworkInterest = async (networkId: number) => {
    await eligibilityService.removeNetworkInterest(networkId);
    toast.success('Interesse removido');
    await refetch();
  };

  const addSchoolExclusion = async (schoolId: number) => {
    await eligibilityService.addSchoolExclusion(schoolId);
    toast.success('Escola excluída das suas vagas');
    await refetch();
  };

  const removeSchoolExclusion = async (schoolId: number) => {
    await eligibilityService.removeSchoolExclusion(schoolId);
    toast.success('Exclusão removida');
    await refetch();
  };

  return {
    preferences,
    loading,
    addNetworkInterest,
    removeNetworkInterest,
    addSchoolExclusion,
    removeSchoolExclusion,
  };
}

export function useTeacherGroups(schoolId: number | null) {
  const [data, setData] = useState<TeacherGroupsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      setData(await eligibilityService.getTeacherGroups(schoolId));
    } catch {
      toast.error('Erro ao carregar os grupos de prioridade');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createGroup = async (name: string, delayMinutes: number) => {
    if (!schoolId) return;
    const updated = await eligibilityService.createTeacherGroup(schoolId, {
      name,
      delayMinutes,
    });
    setData(updated);
    toast.success('Grupo criado');
    return updated;
  };

  const updateGroup = async (
    groupId: number,
    payload: { name?: string; delayMinutes?: number },
  ) => {
    if (!schoolId) return;
    const updated = await eligibilityService.updateTeacherGroup(
      schoolId,
      groupId,
      payload,
    );
    setData(updated);
    toast.success('Grupo atualizado');
    return updated;
  };

  const removeGroup = async (groupId: number) => {
    if (!schoolId) return;
    const updated = await eligibilityService.removeTeacherGroup(schoolId, groupId);
    setData(updated);
    toast.success('Grupo removido');
    return updated;
  };

  const setGroupMembers = async (groupId: number, professorIds: number[]) => {
    if (!schoolId) return;
    const updated = await eligibilityService.setTeacherGroupMembers(
      schoolId,
      groupId,
      professorIds,
    );
    setData(updated);
    toast.success('Professores do grupo atualizados');
    return updated;
  };

  const updateSettings = async (payload: {
    ungroupedDelayMinutes?: number;
    acceptedNetworkIds?: number[] | null;
  }) => {
    if (!schoolId) return;
    const updated = await eligibilityService.updatePrioritySettings(
      schoolId,
      payload,
    );
    setData(updated);
    toast.success('Configurações de prioridade atualizadas');
    return updated;
  };

  return {
    data,
    loading,
    createGroup,
    updateGroup,
    removeGroup,
    setGroupMembers,
    updateSettings,
    refetch,
  };
}

export function useInterconnections(networkId: number | null) {
  const [data, setData] = useState<NetworkInterconnectionsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!networkId) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      setData(await eligibilityService.getInterconnections(networkId));
    } catch {
      toast.error('Erro ao carregar as interconexões');
    } finally {
      setLoading(false);
    }
  }, [networkId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = async (allowedNetworkIds: number[]) => {
    if (!networkId) return;
    const updated = await eligibilityService.setInterconnections(
      networkId,
      allowedNetworkIds,
    );
    setData(updated);
    toast.success('Interconexões atualizadas');
    return updated;
  };

  return { data, loading, save };
}
