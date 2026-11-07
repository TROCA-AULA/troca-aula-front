import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterService } from '@/services/master.service';
import type { Network, CreateNetworkRequest, UpdateNetworkRequest } from '@/types/master';

// Redes de Ensino (tenant real, Design Doc ADR-004). Usado tanto pela tela
// de gestão (/master/redes) quanto por outros formulários que só precisam
// listar (ex.: seletor de rede em SchoolForm/WorkloadPolicyForm).
export function useNetworks() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNetworks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await masterService.getNetworks();
      setNetworks(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar redes';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  const createNetwork = async (data: CreateNetworkRequest) => {
    try {
      const created = await masterService.createNetwork(data);
      setNetworks((prev) => [...prev, created]);
      toast.success('Rede criada com sucesso');
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar rede';
      toast.error(message);
      throw err;
    }
  };

  const updateNetwork = async (id: number, data: UpdateNetworkRequest) => {
    try {
      const updated = await masterService.updateNetwork(id, data);
      setNetworks((prev) => prev.map((n) => (n.id === id ? updated : n)));
      toast.success('Rede atualizada com sucesso');
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar rede';
      toast.error(message);
      throw err;
    }
  };

  return { networks, loading, error, createNetwork, updateNetwork, refetch: fetchNetworks };
}
