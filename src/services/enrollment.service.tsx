// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';
import type {
  EnrollmentRequest,
  CreateEnrollmentRequest,
  EnrollmentListParams,
  EnrollmentActionResponse,
  EnrollmentListResponse,
  Class
} from '@/types/enrollment';

export const enrollmentService = {
  getAvailableClasses: async (): Promise<Class[]> => {
    const response = await api.get('/classes?available=true');
    return response.data?.data ?? response.data;
  },

  getEnrollments: async (params?: EnrollmentListParams): Promise<EnrollmentRequest[]> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (!params?.userId && params?.professorId) queryParams.append('professorId', params.professorId.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.schoolId) queryParams.append('schoolId', params.schoolId.toString());
    const response = await api.get<EnrollmentListResponse>(`/enrollment-requests?${queryParams.toString()}`);
    return response.data?.data ?? response.data;
  },

  getEnrollment: async (id: number): Promise<EnrollmentRequest> => {
    const response = await api.get<{ data: EnrollmentRequest }>(`/enrollment-requests/${id}`);
    return response.data?.data ?? response.data;
  },

  createEnrollment: async (data: CreateEnrollmentRequest): Promise<EnrollmentRequest> => {
    const response = await api.post<{ data: EnrollmentRequest }>(
      `/enrollment-requests/request/${data.classId}`,
    );
    return response.data?.data ?? response.data;
  },

  approveEnrollment: async (id: number): Promise<EnrollmentRequest> => {
    const response = await api.patch<EnrollmentActionResponse>(`/enrollment-requests/${id}/approve`);
    return response.data?.data ?? response.data;
  },

  rejectEnrollment: async (id: number, reason?: string): Promise<EnrollmentRequest> => {
    const response = await api.patch<EnrollmentActionResponse>(`/enrollment-requests/${id}/reject`, {
      rejectionReason: reason,
    });
    return response.data?.data ?? response.data;
  },

  cancelEnrollment: async (id: number): Promise<EnrollmentRequest> => {
    const response = await api.delete<EnrollmentActionResponse>(`/enrollment-requests/${id}`);
    return response.data?.data ?? response.data;
  },
};
