import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterService } from '@/services/master.service';
import type { AuditLogEntry } from '@/types/master';

// Rastreabilidade por rede (Design Doc Seção 5.3) - só busca quando
// `networkId` é informado (nunca lista "tudo", não existe esse endpoint).
export function useAuditLog(networkId?: number) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!networkId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await masterService.getAuditLogByNetwork(networkId);
      setEntries(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar auditoria';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [networkId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, loading, error, refetch: fetchEntries };
}
