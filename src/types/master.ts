export interface School {
  id: number;
  name: string;
  substitutionLimitPerSemester: number | null;
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
  substitutionLimitPerSemester?: number;
}

export interface UpdateSchoolRequest {
  name?: string;
  substitutionLimitPerSemester?: number;
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
