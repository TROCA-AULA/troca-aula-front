// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx). Centraliza as chamadas que antes
// estavam espalhadas direto no dashboard legado (P9).
import api from '@/api-client.service';
import type { Class } from '@/types/enrollment';

export interface CreateClassPayload {
  schoolId?: number | null;
  subjectId: number;
  createdByd?: number;
  statededAt: string;
  finishedAt: string;
}

export const classesService = {
  // Listagem respeita matéria + janela de prioridade do usuário autenticado
  // (o backend injeta o userId do token, P16).
  getClasses: async (): Promise<Class[]> => {
    const response = await api.get('/classes');
    return response.data?.data ?? response.data;
  },

  createClass: async (payload: CreateClassPayload): Promise<Class> => {
    const response = await api.post('/classes', payload);
    return response.data?.data ?? response.data;
  },

  deleteClass: async (id: number): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },
};
