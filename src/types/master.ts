export interface School {
  id: number;
  name: string;
  networkId: number;
  // Legado (Prisma): coluna ainda existe no banco, mas não é mais aceita
  // por CreateSchoolDto/UpdateSchoolDto — o limite real de carga horária
  // agora vem de WorkloadPolicies por rede (Design Doc, Fase 2). Continua
  // no tipo só para exibição (dado histórico), nunca enviado nas requests.
  substitutionLimitPerSemester: number | null;
  // Obsoleto: a janela de prioridade em horas foi trocada pelos grupos de
  // prioridade da escola. A coluna ainda vem do backend, mas não é usada.
  priorityWindowHours?: number | null;
  createdAt: string;
}

// Rede de Ensino (tenant real, Design Doc ADR-004) — sem tela própria ainda,
// só consumida aqui para popular o seletor do formulário de escola.
export interface Network {
  id: number;
  name: string;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  schoolId: number | null;
  profileId: number;
  createdAt: string;
}

// Retornado só pelo fluxo de criação (masterService.createUser). A senha
// temporária vem do servidor (reset-password), que também a envia por
// e-mail quando há SMTP configurado (emailSent).
export interface CreatedUser extends User {
  tempPassword: string;
  emailSent?: boolean;
}

export interface CreateSchoolRequest {
  name: string;
  networkId: number;
}

export interface UpdateSchoolRequest {
  name?: string;
  networkId?: number;
}

export interface CreateNetworkRequest {
  name: string;
}

export interface UpdateNetworkRequest {
  name?: string;
}

// Catálogo fixo (5 linhas seedadas via migration, sem controller de
// escrita no backend — ADR-003 do Design Doc: categorias legais nacionais,
// não variam por rede/escola). Sem tela própria: hardcode aqui, não vale a
// pena um módulo de backend só pra ler 5 linhas que nunca mudam.
export const WORKLOAD_TYPES = [
  { id: 1, code: 'AULA', name: 'Horas-aula de interação com alunos' },
  { id: 2, code: 'PEDAGOGICO_COLETIVO', name: 'Trabalho pedagógico coletivo' },
  { id: 3, code: 'LIVRE_ESCOLHA', name: 'Trabalho pedagógico em local de livre escolha' },
  { id: 4, code: 'SUPLEMENTAR', name: 'Carga suplementar' },
  { id: 5, code: 'SUBSTITUICAO', name: 'Aulas de substituição' },
] as const;

export interface WorkloadPolicy {
  id: number;
  networkId: number;
  workloadTypeId: number;
  maxHoursPerWeek: number | null;
  ataOficialRequired: boolean;
  createdAt: string;
}

export interface CreateWorkloadPolicyRequest {
  networkId: number;
  workloadTypeId: number;
  maxHoursPerWeek?: number;
  ataOficialRequired?: boolean;
}

export interface UpdateWorkloadPolicyRequest {
  networkId?: number;
  workloadTypeId?: number;
  maxHoursPerWeek?: number;
  ataOficialRequired?: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  schoolId: number;
  profileId: number;
}

export interface DashboardStats {
  totalSchools: number;
  totalClassesAvailable: number;
  totalSubstitutionsThisMonth: number;
}

export interface SchoolsPageState {
  schools: School[];
  loading: boolean;
  error: string | null;
  formModal: {
    open: boolean;
    mode: 'create' | 'edit';
    data: School | null;
  };
}

export interface UsersPageState {
  users: User[];
  loading: boolean;
  error: string | null;
  filters: {
    // Correção: era 2|3 (mapeamento antigo, incompatível com o backend real);
    // ver src/constants/profile.ts (DIRETOR=1, AUXILIAR_ADMIN=2).
    profileId: 1 | 2;
    schoolId?: number;
  };
  formModal: {
    open: boolean;
    mode: 'create' | 'edit';
    data: User | null;
  };
}

// Rastreabilidade (Design Doc Seção 5.3) - hoje só TeacherWorkloadRecords
// grava entradas aqui (ver AuditLogService.record no backend).
export interface AuditLogEntry {
  id: number;
  networkId: number;
  entityType: string;
  entityId: number;
  changedById: number;
  changedByName: string | null;
  changedByEmail: string | null;
  before: unknown;
  after: unknown;
  justification: string | null;
  changedAt: string;
}

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiState<T> {
  data: T | null;
  status: RequestStatus;
  error: string | null;
}

// PATCH /users/:id — só dados de cadastro (sem senha, escola ou perfil).
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
}

// Coordenador municipal: pessoa ↔ rede (município). Gerido só pelo MASTER.
export interface NetworkCoordinator {
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  networkId: number;
  networkName: string | null;
  approvedAt: string | null;
}
