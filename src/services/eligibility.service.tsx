// Client-side: usa o proxy Next.js (ver src/api-client.service.tsx).
// Fase 5 — preferências do professor e configuração de prioridade.
import api from '@/api-client.service';

export interface PriorityTier {
  order: number;
  delayMinutes: number;
  scopeType: string;
  restrictedNetworkIds?: number[] | null;
}

export interface PriorityTiersResponse {
  schoolId: number;
  fallbackPriorityWindowHours: number | null;
  allowedNetworkIds: number[];
  tiers: PriorityTier[];
}

export interface ProfessorPreferencesResponse {
  networkInterests: Array<{ networkId: number; networkName: string | null }>;
  schoolExclusions: Array<{ schoolId: number; schoolName: string | null }>;
}

export interface NetworkInterconnectionsResponse {
  networkId: number;
  interconnections: Array<{ networkId: number; networkName: string | null }>;
}

export const eligibilityService = {
  getMyPreferences: async (): Promise<ProfessorPreferencesResponse> => {
    const response = await api.get('/professor-preferences');
    return response.data?.data ?? response.data;
  },

  addNetworkInterest: async (networkId: number): Promise<void> => {
    await api.post('/professor-preferences/network-interests', { networkId });
  },

  removeNetworkInterest: async (networkId: number): Promise<void> => {
    await api.delete(`/professor-preferences/network-interests/${networkId}`);
  },

  addSchoolExclusion: async (schoolId: number): Promise<void> => {
    await api.post('/professor-preferences/school-exclusions', { schoolId });
  },

  removeSchoolExclusion: async (schoolId: number): Promise<void> => {
    await api.delete(`/professor-preferences/school-exclusions/${schoolId}`);
  },

  getPriorityTiers: async (schoolId: number): Promise<PriorityTiersResponse> => {
    const response = await api.get(`/schools/${schoolId}/priority-tiers`);
    return response.data?.data ?? response.data;
  },

  setPriorityTiers: async (
    schoolId: number,
    tiers: PriorityTier[],
  ): Promise<PriorityTiersResponse> => {
    const response = await api.put(`/schools/${schoolId}/priority-tiers`, {
      tiers,
    });
    return response.data?.data ?? response.data;
  },

  getInterconnections: async (
    networkId: number,
  ): Promise<NetworkInterconnectionsResponse> => {
    const response = await api.get(`/networks/${networkId}/interconnections`);
    return response.data?.data ?? response.data;
  },

  setInterconnections: async (
    networkId: number,
    allowedNetworkIds: number[],
  ): Promise<NetworkInterconnectionsResponse> => {
    const response = await api.put(
      `/networks/${networkId}/interconnections`,
      { allowedNetworkIds },
    );
    return response.data?.data ?? response.data;
  },
};
