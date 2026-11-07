'use client';
import { useState, useEffect } from 'react';
// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';

interface SubstitutionLimitState {
  current: number;
  limit: number | null;
  percentage: number;
  canApply: boolean;
  loading: boolean;
  error: string | null;
}

// P14 (problemas-conhecidos.md, corrigido): antes calculava o semestre com
// `new Date()` do navegador e recontava aprovações no cliente — divergia do
// gate real do backend, que nem tinha recorte de semestre. Agora só
// consome `GET /enrollment-requests/substitution-limit/:professorId`, que
// devolve o status já calculado no servidor (fonte única de verdade tanto
// da data "agora" quanto da contagem).
export const useSubstitutionLimit = (userId?: number): SubstitutionLimitState => {
  const [state, setState] = useState<SubstitutionLimitState>({
    current: 0,
    limit: null,
    percentage: 0,
    canApply: true,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api.get(`/enrollment-requests/substitution-limit/${userId}`);
        const data = response.data?.data ?? response.data;
        if (cancelled) return;
        setState({
          current: data.current,
          limit: data.limit,
          percentage: data.percentage,
          canApply: data.canApply,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Erro ao carregar dados',
        }));
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
};
