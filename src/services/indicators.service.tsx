// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';
import type { CoverageStats, CoverageStatsParams } from '@/types/indicators';
import type { Subject } from '@/types/teacher';

export const indicatorsService = {
  // Fase 4 (COULD) do Design Doc: GET /classes/coverage-stats. Protegido por
  // TenantGuard quando schoolId é informado (exige vínculo aprovado ou MASTER).
  getCoverageStats: async (params: CoverageStatsParams): Promise<CoverageStats> => {
    const query = new URLSearchParams();
    if (params.schoolId) query.append('schoolId', String(params.schoolId));
    if (params.subjectId) query.append('subjectId', String(params.subjectId));
    if (params.dayOfWeek !== undefined) {
      query.append('dayOfWeek', String(params.dayOfWeek));
    }
    const response = await api.get(`/classes/coverage-stats?${query.toString()}`);
    return response.data?.data ?? response.data;
  },

  // Catálogo global de disciplinas (leitura pública no backend).
  getSubjects: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects');
    return response.data?.data ?? response.data;
  },
};
