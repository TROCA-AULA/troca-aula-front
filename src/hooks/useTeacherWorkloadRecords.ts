import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { teacherWorkloadService } from '@/services/teacher-workload.service';
import type {
  TeacherWorkloadRecord,
  CreateTeacherWorkloadRecordRequest,
} from '@/types/workload';

export function useTeacherWorkloadRecords(schoolId: number | null) {
  const [records, setRecords] = useState<TeacherWorkloadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await teacherWorkloadService.getBySchool(schoolId);
      setRecords(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar jornada docente';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Toast de erro específico (ex.: limite da política de carga horária da
  // rede excedido) já sobe pelo interceptor de src/api-client.service.tsx -
  // aqui só relançamos para o formulário saber que falhou.
  const createRecord = async (data: CreateTeacherWorkloadRecordRequest) => {
    try {
      const created = await teacherWorkloadService.create(data);
      setRecords((prev) => [...prev, created]);
      toast.success('Registro de jornada criado com sucesso');
      return created;
    } catch (err) {
      throw err;
    }
  };

  const removeRecord = async (id: number) => {
    try {
      await teacherWorkloadService.remove(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast.success('Registro removido');
    } catch (err) {
      throw err;
    }
  };

  return { records, loading, error, createRecord, removeRecord, refetch: fetchRecords };
}
