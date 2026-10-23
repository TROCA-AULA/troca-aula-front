import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterService } from '@/services/master.service';
import type { School, CreateSchoolRequest, UpdateSchoolRequest } from '@/types/master';

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await masterService.getSchools();
      setSchools(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar escolas';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const createSchool = async (data: CreateSchoolRequest) => {
    try {
      const newSchool = await masterService.createSchool(data);
      setSchools((prev) => [...prev, newSchool]);
      toast.success('Escola criada com sucesso');
      return newSchool;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar escola';
      toast.error(message);
      throw err;
    }
  };

  const updateSchool = async (id: number, data: UpdateSchoolRequest) => {
    try {
      const updated = await masterService.updateSchool(id, data);
      setSchools((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success('Escola atualizada com sucesso');
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar escola';
      toast.error(message);
      throw err;
    }
  };

  const deleteSchool = async (id: number) => {
    try {
      await masterService.deleteSchool(id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
      toast.success('Escola excluída com sucesso');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir escola';
      toast.error(message);
      throw err;
    }
  };

  return {
    schools,
    loading,
    error,
    createSchool,
    updateSchool,
    deleteSchool,
    refetch: fetchSchools,
  };
}