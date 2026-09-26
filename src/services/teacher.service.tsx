'use client';

import api from '@/api.service';
import { PROFILE } from '@/constants/profile';
import { Teacher, EnrollmentRequest } from '@/types/teacher';

// `GET /users` agora aceita filtros reais de query (`schoolId`, `profileId`,
// via UsersProfilesSchools) — corrigido no backend como parte do P15. O
// shape de cada item continua trazendo `upsUser: [{schoolId, profileId}]`
// (não campos planos), então achatamos aqui para o que `Teacher` espera.
interface RawUpsLink {
  schoolId: number;
  profileId: number;
}
interface RawTeacher {
  id: number;
  name: string;
  email: string;
  subject?: Teacher['subject'];
  totalSubstitutions?: number;
  upsUser?: RawUpsLink[];
}

function flattenTeacher(raw: RawTeacher, schoolId?: string): Teacher {
  const links = raw.upsUser ?? [];
  const link =
    (schoolId !== undefined &&
      links.find((l) => String(l.schoolId) === schoolId)) ||
    links[0];
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.email,
    schoolId: link ? String(link.schoolId) : null,
    profileId: link?.profileId ?? PROFILE.PROFESSOR,
    subject: raw.subject ?? null,
    totalSubstitutions: raw.totalSubstitutions ?? 0,
  };
}

export const teacherService = {
  async getLinkedTeachers(schoolId: string): Promise<Teacher[]> {
    const response = await api.get('/users', {
      params: { schoolId, profileId: PROFILE.PROFESSOR },
    });
    const raw: RawTeacher[] = response.data?.data ?? response.data;
    return raw.map((t) => flattenTeacher(t, schoolId));
  },

  async getAvailableTeachers(schoolId: string): Promise<Teacher[]> {
    // "Disponível" = professor com vínculo em qualquer OUTRA escola, ou sem
    // vínculo nenhum ainda — como não há endpoint de "professores sem
    // vínculo", listamos todos os PROFESSOR e filtramos no cliente quem já
    // está vinculado a ESTA escola (mantendo o comportamento anterior de
    // "quem falta vincular aqui").
    const response = await api.get('/users', {
      params: { profileId: PROFILE.PROFESSOR },
    });
    const raw: RawTeacher[] = response.data?.data ?? response.data;
    return raw
      .map((t) => flattenTeacher(t))
      .filter((teacher) => teacher.schoolId !== schoolId);
  },

  // Vincular = assign-profile com perfil PROFESSOR (guardado por
  // TenantGuard/RolesGuard desde a Fase 0 — quem chama precisa já ter
  // vínculo de gestão NAQUELA escola).
  async linkTeacher(userId: string, schoolId: string): Promise<void> {
    await api.post(`/users/${userId}/assign-profile`, {
      profileId: PROFILE.PROFESSOR,
      schoolId: Number(schoolId),
    });
  },

  // Desvincular = contraparte de assign-profile (endpoint novo do P15,
  // remove a linha de UsersProfilesSchools).
  async unlinkTeacher(userId: string, schoolId: string): Promise<void> {
    await api.post(`/users/${userId}/unassign-profile`, {
      profileId: PROFILE.PROFESSOR,
      schoolId: Number(schoolId),
    });
  },

  async getEnrollmentRequests(
    schoolId: string,
    status?: string
  ): Promise<EnrollmentRequest[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;

    const response = await api.get('/enrollment-requests', { params });
    return response.data?.data ?? response.data;
  },

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<EnrollmentRequest> {
    const endpoint = status === 'APPROVED' ? 'approve' : 'reject';
    const response = await api.patch(
      `/enrollment-requests/${enrollmentId}/${endpoint}`,
    );
    return response.data?.data ?? response.data;
  },
};

export default teacherService;
