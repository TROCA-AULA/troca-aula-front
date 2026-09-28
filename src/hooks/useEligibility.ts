import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  eligibilityService,
  PriorityTier,
  PriorityTiersResponse,
  ProfessorPreferencesResponse,
  NetworkInterconnectionsResponse,
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

export function usePriorityTiers(schoolId: number | null) {
  const [data, setData] = useState<PriorityTiersResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      setData(await eligibilityService.getPriorityTiers(schoolId));
    } catch {
      toast.error('Erro ao carregar os níveis de prioridade');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = async (tiers: PriorityTier[]) => {
    if (!schoolId) return;
    const updated = await eligibilityService.setPriorityTiers(schoolId, tiers);
    setData(updated);
    toast.success('Níveis de prioridade atualizados');
    return updated;
  };

  return { data, loading, save, refetch };
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
