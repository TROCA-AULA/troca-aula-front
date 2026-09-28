// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';
import type {
  TeacherWorkloadRecord,
  CreateTeacherWorkloadRecordRequest,
} from '@/types/workload';

export const teacherWorkloadService = {
  // schoolId obrigatório no backend real (TenantGuard exige escopo de
  // escola nesta rota de listagem "de gestão").
  getBySchool: async (schoolId: number): Promise<TeacherWorkloadRecord[]> => {
    const response = await api.get('/teacher-workload-records', {
      params: { schoolId },
    });
    return response.data?.data ?? response.data;
  },

  // Professor vê os próprios registros, em qualquer escola (sem exigir
  // perfil de gestão) - contraparte de `getBySchool` (que exige RolesGuard).
  getMine: async (): Promise<TeacherWorkloadRecord[]> => {
    const response = await api.get('/teacher-workload-records/me');
    return response.data?.data ?? response.data;
  },

  create: async (
    data: CreateTeacherWorkloadRecordRequest,
  ): Promise<TeacherWorkloadRecord> => {
    const response = await api.post('/teacher-workload-records', data);
    return response.data?.data ?? response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/teacher-workload-records/${id}`);
  },
};
