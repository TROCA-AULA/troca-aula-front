// Client-side: usa o proxy Next.js, não o backend direto (ver
// src/api-client.service.tsx). Extraído para o dashboard legado parar de
// chamar `api.get('/schools')` direto na página (P9).
import api from '@/api-client.service';
import type { School } from '@/types/master';

export const schoolsService = {
  getSchools: async (): Promise<School[]> => {
    const response = await api.get('/schools');
    return response.data?.data ?? response.data;
  },

  getSchool: async (id: number): Promise<School> => {
    const response = await api.get(`/schools/${id}`);
    return response.data?.data ?? response.data;
  },
};
