import api from '@/api.service';
import type {
  School,
  User,
  CreatedUser,
  CreateSchoolRequest,
  UpdateSchoolRequest,
  CreateUserRequest,
  DashboardStats,
} from '@/types/master';

// O backend não tem fluxo de convite/definição de senha por e-mail — gera
// uma senha temporária forte o bastante para passar na validação do
// servidor, que o Master precisa repassar manualmente à pessoa cadastrada.
function generateTempPassword(): string {
  const bytes = new Uint8Array(9);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '').slice(0, 12);
}

// O `GET /users` real devolve cada usuário com `upsUser: [{schoolId,
// profileId, ...}]` (todos os vínculos), não os campos planos `schoolId`/
// `profileId` que o tipo `User` (e as telas de diretores/administradores)
// esperam. Acha o vínculo relevante (o que bate com o filtro pedido, ou o
// primeiro) e achata pra o formato que o resto do app já consome.
interface RawUpsLink {
  schoolId: number;
  profileId: number;
}
interface RawUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  upsUser?: RawUpsLink[];
}

function flattenUser(raw: RawUser, filterProfileId?: number, filterSchoolId?: number): User {
  const links = raw.upsUser ?? [];
  const link =
    links.find(
      (l) =>
        (filterProfileId === undefined || l.profileId === filterProfileId) &&
        (filterSchoolId === undefined || l.schoolId === filterSchoolId),
    ) ?? links[0];
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? null,
    schoolId: link?.schoolId ?? null,
    profileId: link?.profileId ?? 0,
    createdAt: raw.createdAt,
  };
}

export const masterService = {
  getSchools: async (): Promise<School[]> => {
    const response = await api.get('/schools');
    return response.data?.data ?? response.data;
  },

  getSchool: async (id: number): Promise<School> => {
    const response = await api.get(`/schools/${id}`);
    return response.data?.data ?? response.data;
  },

  createSchool: async (data: CreateSchoolRequest): Promise<School> => {
    const response = await api.post('/schools', data);
    return response.data?.data ?? response.data;
  },

  updateSchool: async (id: number, data: UpdateSchoolRequest): Promise<School> => {
    const response = await api.patch(`/schools/${id}`, data);
    return response.data?.data ?? response.data;
  },

  deleteSchool: async (id: number): Promise<void> => {
    await api.delete(`/schools/${id}`);
  },

  getUsers: async (profileId?: number, schoolId?: number): Promise<User[]> => {
    const params = new URLSearchParams();
    if (profileId) params.append('profileId', profileId.toString());
    if (schoolId) params.append('schoolId', schoolId.toString());
    const response = await api.get(`/users?${params.toString()}`);
    const raw: RawUser[] = response.data?.data ?? response.data;
    return raw.map((u) => flattenUser(u, profileId, schoolId));
  },

  // Fluxo real do backend: criação de usuário e vínculo a uma escola/perfil
  // são dois passos separados. `POST /users` só aceita dados base
  // (name/email/phone/password); o vínculo é feito depois via
  // `assign-profile` (guardado por TenantGuard/RolesGuard desde a Fase 0 —
  // só MASTER/DIRETOR/AUXILIAR_ADMIN daquela escola pode vincular). Ver P15
  // em problemas-conhecidos.md.
  createUser: async (data: CreateUserRequest): Promise<CreatedUser> => {
    const tempPassword = generateTempPassword();
    const created = await api.post('/users', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: tempPassword,
    });
    const user: RawUser = created.data?.data ?? created.data;

    try {
      await api.post(`/users/${user.id}/assign-profile`, {
        profileId: data.profileId,
        schoolId: data.schoolId,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'erro desconhecido';
      throw new Error(
        `Usuário "${data.name}" foi criado, mas o vínculo com a escola falhou (${detail}). Peça a outro administrador para vinculá-lo manualmente.`,
      );
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      schoolId: data.schoolId,
      profileId: data.profileId,
      createdAt: user.createdAt,
      tempPassword,
    };
  },

  updateUser: async (id: number, data: Partial<CreateUserRequest>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data?.data ?? response.data;
  },

  // Contraparte de assign-profile: remove o vínculo usuário↔perfil↔escola
  // (não existe mais `schoolId: null` no PATCH — o backend real não tem
  // esse campo no UpdateUserDto).
  unlinkUser: async (id: number, profileId: number, schoolId: number): Promise<void> => {
    await api.post(`/users/${id}/unassign-profile`, { profileId, schoolId });
  },

  getClassesAvailable: async (): Promise<number> => {
    const response = await api.get('/classes?available=true');
    const data = response.data?.data ?? response.data;
    return data.length;
  },

  getSubstitutionsThisMonth: async (): Promise<number> => {
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const response = await api.get('/enrollment-requests?status=APPROVED');
    const items = response.data?.data ?? response.data;
    return items.filter((item: { createdAt: string }) =>
      item.createdAt.startsWith(month),
    ).length;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const [schools, classesAvailable, substitutions] = await Promise.all([
      masterService.getSchools(),
      masterService.getClassesAvailable(),
      masterService.getSubstitutionsThisMonth(),
    ]);

    return {
      totalSchools: schools.length,
      totalClassesAvailable: classesAvailable,
      totalSubstitutionsThisMonth: substitutions,
    };
  },
};
