import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterService } from '@/services/master.service';
import type {
  WorkloadPolicy,
  CreateWorkloadPolicyRequest,
  UpdateWorkloadPolicyRequest,
} from '@/types/master';

// Políticas de carga horária por rede (Design Doc, Fase 2/WorkloadPolicies)
// - configuração municipal, não por escola. `networkId` opcional filtra a
// listagem; passar undefined lista de todas as redes.
export function useWorkloadPolicies(networkId?: number) {
  const [policies, setPolicies] = useState<WorkloadPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await masterService.getWorkloadPolicies(networkId);
      setPolicies(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar políticas';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [networkId]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const createPolicy = async (data: CreateWorkloadPolicyRequest) => {
    try {
      const created = await masterService.createWorkloadPolicy(data);
      if (!networkId || created.networkId === networkId) {
        setPolicies((prev) => [...prev, created]);
      }
      toast.success('Política criada com sucesso');
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar política';
      toast.error(message);
      throw err;
    }
  };

  const updatePolicy = async (id: number, data: UpdateWorkloadPolicyRequest) => {
    try {
      const updated = await masterService.updateWorkloadPolicy(id, data);
      setPolicies((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Política atualizada com sucesso');
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar política';
      toast.error(message);
      throw err;
    }
  };

  return { policies, loading, error, createPolicy, updatePolicy, refetch: fetchPolicies };
}
