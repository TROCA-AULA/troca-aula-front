import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterService } from '@/services/master.service';
import type { Network } from '@/types/master';

// Redes de Ensino (tenant real, Design Doc ADR-004) — só leitura, sem tela
// própria de gestão ainda. Usado hoje só para popular o seletor do
// formulário de criação/edição de escola (School.networkId é obrigatório
// no backend desde a Fase 2).
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

  return { networks, loading, error, refetch: fetchNetworks };
}
