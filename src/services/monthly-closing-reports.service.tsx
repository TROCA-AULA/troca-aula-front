// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';
import type {
  MonthlyClosingReport,
  GenerateMonthlyClosingReportRequest,
} from '@/types/workload';

export const monthlyClosingReportsService = {
  getBySchool: async (
    schoolId: number,
    referenceMonth?: string,
    userId?: number,
  ): Promise<MonthlyClosingReport[]> => {
    const response = await api.get('/monthly-closing-reports', {
      params: { schoolId, referenceMonth, userId },
    });
    return response.data?.data ?? response.data;
  },

  generate: async (
    data: GenerateMonthlyClosingReportRequest,
  ): Promise<MonthlyClosingReport> => {
    const response = await api.post('/monthly-closing-reports/generate', data);
    return response.data?.data ?? response.data;
  },

  review: async (id: number): Promise<MonthlyClosingReport> => {
    const response = await api.patch(`/monthly-closing-reports/${id}/review`);
    return response.data?.data ?? response.data;
  },

  close: async (id: number): Promise<MonthlyClosingReport> => {
    const response = await api.patch(`/monthly-closing-reports/${id}/close`);
    return response.data?.data ?? response.data;
  },

  // §6.3: correção explícita — reabre um relatório já conferido/fechado de
  // volta para DRAFT, com justificativa obrigatória (vai para o AuditLog).
  reopen: async (
    id: number,
    justification: string,
  ): Promise<MonthlyClosingReport> => {
    const response = await api.patch(`/monthly-closing-reports/${id}/reopen`, {
      justification,
    });
    return response.data?.data ?? response.data;
  },
};
