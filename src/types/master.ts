export interface School {
  id: number;
  name: string;
  networkId: number;
  // Legado (Prisma): coluna ainda existe no banco, mas não é mais aceita
  // por CreateSchoolDto/UpdateSchoolDto — o limite real de carga horária
  // agora vem de WorkloadPolicies por rede (Design Doc, Fase 2). Continua
  // no tipo só para exibição (dado histórico), nunca enviado nas requests.
  substitutionLimitPerSemester: number | null;
  // Design Doc, Seção 9.2: horas que uma vaga fica visível só para
  // professores vinculados a esta escola antes de abrir geral. null = sem
  // janela. Configurado via endpoint dedicado (updatePriorityWindow), não
  // pelo PATCH /schools/:id genérico.
  priorityWindowHours: number | null;
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

// Retornado só pelo fluxo de criação (masterService.createUser) — o backend
// não tem convite/definição de senha por e-mail hoje, então uma senha
// temporária é gerada no cliente e precisa ser repassada manualmente pelo
// Master a quem foi cadastrado. Ver P15 em problemas-conhecidos.md.
export interface CreatedUser extends User {
  tempPassword: string;
}

export interface CreateSchoolRequest {
  name: string;
  networkId: number;
}

export interface UpdateSchoolRequest {
  name?: string;
  networkId?: number;
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

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiState<T> {
  data: T | null;
  status: RequestStatus;
  error: string | null;
}
