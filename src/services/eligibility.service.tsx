// Client-side: usa o proxy Next.js (ver src/api-client.service.tsx).
// Fase 5 — grupos de prioridade por escola + preferências do professor.
import api from '@/api-client.service';

export interface TeacherGroup {
  id: number;
  name: string;
  delayMinutes: number;
  professorIds: number[];
}

export interface TeacherGroupsResponse {
  schoolId: number;
  /** Delay padrão para professores fora de qualquer grupo. */
  ungroupedDelayMinutes: number;
  /** Fallback retrocompatível (escolas sem grupos). */
  fallbackPriorityWindowHours: number | null;
  /** Redes que a REDE interconectou (o que o município permite). */
  allowedNetworkIds: number[];
  /** Subconjunto que a escola aceita (null = todas as permitidas). */
  acceptedNetworkIds: number[] | null;
  groups: TeacherGroup[];
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

  getTeacherGroups: async (schoolId: number): Promise<TeacherGroupsResponse> => {
    const response = await api.get(`/schools/${schoolId}/teacher-groups`);
    return response.data?.data ?? response.data;
  },

  createTeacherGroup: async (
    schoolId: number,
    data: { name: string; delayMinutes: number },
  ): Promise<TeacherGroupsResponse> => {
    const response = await api.post(`/schools/${schoolId}/teacher-groups`, data);
    return response.data?.data ?? response.data;
  },

  updateTeacherGroup: async (
    schoolId: number,
    groupId: number,
    data: { name?: string; delayMinutes?: number },
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
