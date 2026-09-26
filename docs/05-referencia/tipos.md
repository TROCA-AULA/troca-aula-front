# Referência: Tipos TypeScript

Tipos e interfaces usados no frontend.

## Sessão — `src/user/user.types.tsx`

| Tipo | Campos |
|------|--------|
| `UserData` | `id: string \| number`, `name`, `email`, `profileId?`, `schoolId?` |
| `UserContextType` | `user: UserData \| null`, `isLoading`, `logout()`, `refreshUserData()` |

## Autenticação Gov.br — `src/types/auth.ts`

| Tipo | Campos |
|------|--------|
| `GovbrAuthUrlResponse` | `url`, `state` |
| `GovbrLoginRequest` | `code`, `redirect_uri` |
| `UserDTO` | `id`, `name`, `email`, `cpf`, `roles: string[]` |
| `GovbrLoginResponse` | `token`, `user: UserDTO`, `expires_in` |
| `AuthState` | `user`, `token`, `isAuthenticated`, `isLoading`, `error` |

## Candidaturas — `src/types/enrollment.ts`

| Tipo | Campos / valores |
|------|------------------|
| `EnrollmentStatus` | `'PENDING' \| 'APPROVED' \| 'REJECTED' \| 'CANCELLED'` |
| `EnrollmentRequest` | `id`, `classId`, `professorId`, `userId?`, `status`, `rejectionReason?`, `createdAt`, `updatedAt?` |
| `Class` | `id`, `subjectId`, `subjectName?`, `date`, `available`, `schoolId?` |
| `CreateEnrollmentRequest` | `classId` |
| `EnrollmentListParams` | `professorId?`, `userId?`, `status?`, `schoolId?` |
| `EnrollmentActionResponse` | `data: EnrollmentRequest` |
| `EnrollmentListResponse` | `data: EnrollmentRequest[]` |
| `ApiError` | `message`, `code?` |

## Área Master — `src/types/master.ts`

| Tipo | Campos |
|------|--------|
| `School` | `id`, `name`, `substitutionLimitPerSemester: number \| null`, `createdAt` |
| `User` | `id`, `name`, `email`, `phone: string \| null`, `schoolId: number \| null`, `profileId`, `createdAt` |
| `CreateSchoolRequest` | `name`, `substitutionLimitPerSemester?` |
| `UpdateSchoolRequest` | `name?`, `substitutionLimitPerSemester?` |
| `CreateUserRequest` | `name`, `email`, `phone?`, `password?`, `schoolId`, `profileId` |
| `DashboardStats` | `totalSchools`, `totalClassesAvailable`, `totalSubstitutionsThisMonth` |
| `SchoolsPageState` | estado de UI da página de escolas |
| `UsersPageState` | estado de UI da página de usuários (`profileId: 2 \| 3`) |
| `RequestStatus` | `'idle' \| 'loading' \| 'success' \| 'error'` |
| `ApiState<T>` | `data`, `status`, `error` |

## Professores — `src/types/teacher.ts`

| Tipo | Campos |
|------|--------|
| `Subject` | `id: string`, `name` |
| `Teacher` | `id: string`, `name`, `email`, `schoolId?: string \| null`, `profileId`, `subject?: Subject \| null`, `totalSubstitutions` |
| `EnrollmentStatus` | `'PENDING' \| 'APPROVED' \| 'REJECTED' \| string` |
| `TeacherCandidate` | `id`, `name`, `email`, `subject?`, `totalSubstitutions` |
| `EnrollmentRequest` | `id: string`, `professorId?`, `classId?`, `userId?`, `schoolId?`, `status`, `createdAt?`, `appliedAt?`, `professor?`, `user?` |
| `LinkTeacherRequest` | `schoolId: string \| null` |
| `UpdateEnrollmentStatusRequest` | `status` |

## Inconsistências de Tipos Conhecidas

1. **`id` heterogêneo**: `number` em `enrollment.ts`/`master.ts`, `string` em `teacher.ts`
2. **`EnrollmentStatus` duplicado**: string literal em `enrollment.ts`, union ampla em `teacher.ts`
3. **`EnrollmentRequest` duplicado**: duas interfaces diferentes com o mesmo nome (`enrollment.ts` e `teacher.ts`)
4. **`Class.date` vs `statededAt`**: campos de data sobrepostos; a página `/classes` faz cast com `as any`

Ver [problemas-conhecidos.md](../06-status/problemas-conhecidos.md).