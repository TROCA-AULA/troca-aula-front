// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';
import type {
  School,
  Network,
  User,
  CreatedUser,
  CreateSchoolRequest,
  UpdateSchoolRequest,
  CreateUserRequest,
  DashboardStats,
  CreateNetworkRequest,
  UpdateNetworkRequest,
  WorkloadPolicy,
  CreateWorkloadPolicyRequest,
  UpdateWorkloadPolicyRequest,
  AuditLogEntry,
  NetworkCoordinator,
  UpdateUserRequest,
} from '@/types/master';
import type { Subject } from '@/types/teacher';

// O backend não tem fluxo de convite/definição de senha por e-mail — gera
// uma senha temporária forte o bastante para passar na validação do
// servidor, que o Master precisa repassar manualmente à pessoa cadastrada.
// Sempre 12 caracteres (o backend exige no mínimo 8). Antes, o base64 com
// os símbolos removidos podia ficar mais curto.
const TEMP_PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generateTempPassword(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(
    bytes,
    (byte) => TEMP_PASSWORD_ALPHABET[byte % TEMP_PASSWORD_ALPHABET.length],
  ).join('');
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

  // Rede é o tenant real (Design Doc ADR-004); ainda sem tela própria, só
  // usada aqui para popular o seletor no formulário de criação de escola.
  getNetworks: async (): Promise<Network[]> => {
    const response = await api.get('/networks');
    return response.data?.data ?? response.data;
  },

  createNetwork: async (data: CreateNetworkRequest): Promise<Network> => {
    const response = await api.post('/networks', data);
    return response.data?.data ?? response.data;
  },

  updateNetwork: async (id: number, data: UpdateNetworkRequest): Promise<Network> => {
    const response = await api.patch(`/networks/${id}`, data);
    return response.data?.data ?? response.data;
  },

  getWorkloadPolicies: async (networkId?: number): Promise<WorkloadPolicy[]> => {
    const params = networkId ? `?networkId=${networkId}` : '';
    const response = await api.get(`/workload-policies${params}`);
    return response.data?.data ?? response.data;
  },

  createWorkloadPolicy: async (data: CreateWorkloadPolicyRequest): Promise<WorkloadPolicy> => {
    const response = await api.post('/workload-policies', data);
    return response.data?.data ?? response.data;
  },

  updateWorkloadPolicy: async (
    id: number,
    data: UpdateWorkloadPolicyRequest,
  ): Promise<WorkloadPolicy> => {
    const response = await api.patch(`/workload-policies/${id}`, data);
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

  // Rastreabilidade (MASTER-only no backend, RolesGuard) - só por rede
  // (não existe "listar tudo"; a rede é o recorte natural de auditoria).
  getAuditLogByNetwork: async (networkId: number): Promise<AuditLogEntry[]> => {
    const response = await api.get(`/audit-log/network/${networkId}`);
    return response.data?.data ?? response.data;
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

    const issued = await masterService.issueTempPassword(user.id, tempPassword);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      schoolId: data.schoolId,
      profileId: data.profileId,
      createdAt: user.createdAt,
      ...issued,
    };
  },

  /**
   * Gera no servidor a senha temporária de uma conta recém-criada: o
   * servidor a envia por e-mail quando há SMTP. Se a chamada falhar, fica
   * valendo a senha usada na criação (e o gestor repassa).
   */
  issueTempPassword: async (
    userId: number,
    fallbackPassword: string,
  ): Promise<{ tempPassword: string; emailSent: boolean }> => {
    try {
      const response = await api.post(`/users/${userId}/reset-password`);
      const body = response?.data?.data ?? response?.data;
      if (!body?.tempPassword) return { tempPassword: fallbackPassword, emailSent: false };
      return { tempPassword: body.tempPassword, emailSent: Boolean(body.emailSent) };
    } catch {
      return { tempPassword: fallbackPassword, emailSent: false };
    }
  },

  // Defeito D1: o PATCH /users/:id não aceita mais senha (nem escola/perfil).
  updateUser: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data?.data ?? response.data;
  },

  // Contraparte de assign-profile: remove o vínculo usuário↔perfil↔escola
  // (não existe mais `schoolId: null` no PATCH — o backend real não tem
  // esse campo no UpdateUserDto).
  unlinkUser: async (id: number, profileId: number, schoolId: number): Promise<void> => {
    await api.post(`/users/${id}/unassign-profile`, { profileId, schoolId });
  },

  // ---- Catálogo global de disciplinas (escrita só do MASTER) ----

  getSubjects: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects');
    const list: Subject[] = response.data?.data ?? response.data ?? [];
    return [...list].sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
  },

  createSubject: async (name: string): Promise<Subject> => {
    const response = await api.post('/subjects', { name: name.trim() });
    return response.data?.data ?? response.data;
  },

  renameSubject: async (id: number, name: string): Promise<Subject> => {
    const response = await api.patch(`/subjects/${id}`, { name: name.trim() });
    return response.data?.data ?? response.data;
  },

  // Exclusão lógica: some das listas, mas quem já tinha a disciplina mantém
  // o vínculo antigo até o gestor trocar.
  deleteSubject: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },

  // ---- Coordenador municipal (MASTER-only no backend) ----

  getCoordinators: async (): Promise<NetworkCoordinator[]> => {
    const response = await api.get('/network-coordinators');
    return response.data?.data ?? response.data;
  },

  // Busca exata por e-mail — para vincular quem já tem cadastro.
  findUserByEmail: async (
    email: string,
  ): Promise<{ id: number; name: string; email: string } | null> => {
    const response = await api.get('/users', { params: { email: email.trim() } });
    const raw: RawUser[] = response.data?.data ?? response.data ?? [];
    return raw[0] ? { id: raw[0].id, name: raw[0].name, email: raw[0].email } : null;
  },

  /**
   * Torna a pessoa coordenadora da rede. Se o e-mail ainda não tem
   * cadastro, cria a conta com senha temporária (devolvida uma única vez).
   */
  addCoordinator: async (data: {
    name: string;
    email: string;
    phone: string;
    networkId: number;
  }): Promise<{
    userId: number;
    created: boolean;
    tempPassword?: string;
    emailSent?: boolean;
  }> => {
    const existing = await masterService.findUserByEmail(data.email);
    let userId = existing?.id;
    let tempPassword: string | undefined;
    if (!userId) {
      tempPassword = generateTempPassword();
      const created = await api.post('/users', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: tempPassword,
      });
      userId = (created.data?.data ?? created.data).id as number;
    }
    await api.post('/network-coordinators', { userId, networkId: data.networkId });
    if (!existing && tempPassword) {
      const issued = await masterService.issueTempPassword(userId, tempPassword);
      return { userId, created: true, ...issued };
    }
    return { userId, created: !existing, tempPassword };
  },

  removeCoordinator: async (userId: number, networkId: number): Promise<void> => {
    await api.delete(`/network-coordinators/${userId}/${networkId}`);
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
