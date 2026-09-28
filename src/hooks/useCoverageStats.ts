import { useEffect, useState } from 'react';
import { indicatorsService } from '@/services/indicators.service';
import type { CoverageStats } from '@/types/indicators';

// Parâmetros primitivos de propósito: um objeto inline no chamador
// reiniciaria o efeito a cada render (loop de fetch).
export function useCoverageStats(
  schoolId?: number,
  subjectId?: number,
  dayOfWeek?: number,
) {
  const [stats, setStats] = useState<CoverageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setStats(null);
      return;
    }
    let cancelled = false;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await indicatorsService.getCoverageStats({
          schoolId,
          subjectId,
          dayOfWeek,
        });
        if (!cancelled) setStats(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar indicador');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [schoolId, subjectId, dayOfWeek]);

  return { stats, loading, error };
}
