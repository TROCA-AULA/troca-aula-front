'use client';

// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';
import { PROFILE } from '@/constants/profile';
import {
  Teacher,
  EnrollmentRequest,
  TeacherSearchResult,
  UpdateTeacherRequest,
} from '@/types/teacher';

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
  phone?: string | null;
  subjectId?: number | null;
  substitutionLimitPerSemester?: number | null;
  subject?: Teacher['subject'];
  totalSubstitutions?: number;
  upsUser?: RawUpsLink[];
}

function flattenTeacher(raw: RawTeacher, schoolId?: number): Teacher {
  const links = raw.upsUser ?? [];
  const link =
    (schoolId !== undefined && links.find((l) => l.schoolId === schoolId)) ||
    links[0];
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? null,
    schoolId: link ? link.schoolId : null,
    profileId: link?.profileId ?? PROFILE.PROFESSOR,
    subject: raw.subject ?? null,
    subjectId: raw.subjectId ?? null,
    substitutionLimitPerSemester: raw.substitutionLimitPerSemester ?? null,
    totalSubstitutions: raw.totalSubstitutions ?? 0,
  };
}

export const teacherService = {
  async getLinkedTeachers(schoolId: number): Promise<Teacher[]> {
    const response = await api.get('/users', {
      params: { schoolId, profileId: PROFILE.PROFESSOR },
    });
    const raw: RawTeacher[] = response.data?.data ?? response.data;
    return raw.map((t) => flattenTeacher(t, schoolId));
  },

  async getAvailableTeachers(schoolId: number): Promise<Teacher[]> {
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

  // Busca exata por e-mail — é assim que a direção acha um professor que
  // acabou de se cadastrar (o backend não deixa gestor listar todo mundo).
  async findByEmail(email: string): Promise<TeacherSearchResult | null> {
    const response = await api.get('/users', {
      params: { email: email.trim() },
    });
    const raw: RawTeacher[] = response.data?.data ?? response.data ?? [];
    const found = raw[0];
    if (!found) return null;
    return {
      id: found.id,
      name: found.name,
      email: found.email,
      subjectId: found.subjectId ?? null,
      schoolIds: found.upsUser?.map((link) => link.schoolId),
    };
  },

  // Disciplina e limite de substituições (D6/D9). O backend só deixa a
  // direção mudar professor com vínculo aprovado na escola dela.
  async updateTeacher(userId: number, data: UpdateTeacherRequest): Promise<void> {
    await api.patch(`/users/${userId}`, data);
  },

  // Vincular = assign-profile com perfil PROFESSOR (guardado por
  // TenantGuard/RolesGuard desde a Fase 0 — quem chama precisa já ter
  // vínculo de gestão NAQUELA escola).
  async linkTeacher(userId: number, schoolId: number): Promise<void> {
    await api.post(`/users/${userId}/assign-profile`, {
      profileId: PROFILE.PROFESSOR,
      schoolId,
    });
  },

  // Desvincular = contraparte de assign-profile (endpoint novo do P15,
  // remove a linha de UsersProfilesSchools).
  async unlinkTeacher(userId: number, schoolId: number): Promise<void> {
    await api.post(`/users/${userId}/unassign-profile`, {
      profileId: PROFILE.PROFESSOR,
      schoolId,
    });
  },

  async getEnrollmentRequests(
    schoolId: number,
    status?: string
  ): Promise<EnrollmentRequest[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;

    const response = await api.get('/enrollment-requests', { params });
    return response.data?.data ?? response.data;
  },

  async updateEnrollmentStatus(
    enrollmentId: number,
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
