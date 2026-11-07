import { useState, useEffect, useCallback } from 'react';
import { teacherWorkloadService } from '@/services/teacher-workload.service';
import type { TeacherWorkloadRecord } from '@/types/workload';

// Contraparte de useTeacherWorkloadRecords (visão de gestão, por escola):
// esta é a visão do próprio professor sobre os registros dele, em
// qualquer escola em que tenha lançamento - sem exigir perfil de gestão.
export function useMyWorkloadRecords() {
  const [records, setRecords] = useState<TeacherWorkloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherWorkloadService.getMine();
      setRecords(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar jornada docente';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}
