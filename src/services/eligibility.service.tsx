// Client-side: usa o proxy Next.js (ver src/api-client.service.tsx).
// Fase 5 — grupos de prioridade por escola + preferências do professor.
import api from '@/api-client.service';

export interface TeacherGroup {
  id: number;
  name: string;
  /** 0 = primeiro a receber; quanto maior, mais tarde. */
  priority: number;
  delayMinutes: number;
  professorIds: number[];
}

export interface TeacherGroupsResponse {
  schoolId: number;
  /** Espera mínima configurada para quem está fora de qualquer grupo. */
  ungroupedDelayMinutes: number;
  /**
   * Quando quem está SEM grupo passa a ver a vaga: depois do último grupo
   * (ou da espera acima, se for maior). null = escola sem grupos, todo
   * mundo vê na hora.
   */
  ungroupedEffectiveDelayMinutes: number | null;
  /** Redes que a REDE interconectou (o que o município permite). */
  allowedNetworkIds: number[];
  /** Mesmas redes, com nome (o professor/diretor não enxerga outras redes). */
  allowedNetworks?: Array<{ id: number; name: string | null }>;
  /** Subconjunto que a escola aceita (null = todas as permitidas). */
  acceptedNetworkIds: number[] | null;
  groups: TeacherGroup[];
}

/** Todas as redes e escolas (só id e nome) para o professor escolher. */
export interface PreferenceOptionsResponse {
  networks: Array<{ id: number; name: string }>;
  schools: Array<{ id: number; name: string; networkId: number }>;
}

export interface ProfessorPreferencesResponse {
  networkInterests: Array<{ networkId: number; networkName: string | null }>;
  schoolExclusions: Array<{ schoolId: number; schoolName: string | null }>;
  /** Município onde o professor mora (Users.residenceNetworkId). */
  residenceNetworkId?: number | null;
  residenceNetworkName?: string | null;
  /**
   * Tem vínculo aprovado com alguma escola. Contrato prevalece: com
   * contrato, a residência não muda a prioridade.
   */
  hasContract?: boolean;
}

export interface NetworkInterconnectionsResponse {
  networkId: number;
  interconnections: Array<{ networkId: number; networkName: string | null }>;
}

export const eligibilityService = {
  // Defeito D5: GET /networks e GET /schools respeitam o RLS e só traziam
  // a rede do próprio professor — ele não conseguia marcar interesse em
  // outro município. Este endpoint lista tudo (só id e nome).
  getPreferenceOptions: async (): Promise<PreferenceOptionsResponse> => {
    const response = await api.get('/professor-preferences/options');
    return response.data?.data ?? response.data;
  },

  getMyPreferences: async (): Promise<ProfessorPreferencesResponse> => {
    const response = await api.get('/professor-preferences');
    return response.data?.data ?? response.data;
  },

  // PATCH /users/:id — o próprio professor pode mudar onde mora (null limpa).
  setResidence: async (userId: number, networkId: number | null): Promise<void> => {
    await api.patch(`/users/${userId}`, { residenceNetworkId: networkId });
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

  getTeacherGroups: async (schoolId: number): Promise<TeacherGroupsResponse> => {
    const response = await api.get(`/schools/${schoolId}/teacher-groups`);
    return response.data?.data ?? response.data;
  },

  createTeacherGroup: async (
    schoolId: number,
    data: { name: string; delayMinutes: number; priority?: number },
  ): Promise<TeacherGroupsResponse> => {
    const response = await api.post(`/schools/${schoolId}/teacher-groups`, data);
    return response.data?.data ?? response.data;
  },

  updateTeacherGroup: async (
    schoolId: number,
    groupId: number,
    data: { name?: string; delayMinutes?: number; priority?: number },
  ): Promise<TeacherGroupsResponse> => {
    const response = await api.patch(
      `/schools/${schoolId}/teacher-groups/${groupId}`,
      data,
    );
    return response.data?.data ?? response.data;
  },

  removeTeacherGroup: async (
    schoolId: number,
    groupId: number,
  ): Promise<TeacherGroupsResponse> => {
    const response = await api.delete(
      `/schools/${schoolId}/teacher-groups/${groupId}`,
    );
    return response.data?.data ?? response.data;
  },

  setTeacherGroupMembers: async (
    schoolId: number,
    groupId: number,
    professorIds: number[],
  ): Promise<TeacherGroupsResponse> => {
    const response = await api.put(
      `/schools/${schoolId}/teacher-groups/${groupId}/members`,
      { professorIds },
    );
    return response.data?.data ?? response.data;
  },

  updatePrioritySettings: async (
    schoolId: number,
    data: { ungroupedDelayMinutes?: number; acceptedNetworkIds?: number[] | null },
  ): Promise<TeacherGroupsResponse> => {
    const response = await api.patch(
      `/schools/${schoolId}/priority-settings`,
      data,
    );
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
