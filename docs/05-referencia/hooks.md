# Referência: Hooks

Hooks de lógica (controllers). Seguem o padrão `use*.ts` e encapsulam estado, chamadas a serviços e handlers.

## Sessão

### useUserHook — `src/user/useUserHook.tsx`

Gerencia a sessão do usuário autenticado.

| Retorno | Tipo | Descrição |
|---------|------|-----------|
| `user` | `UserData \| null` | Dados da sessão (id, name, email, profileId, schoolId) |
| `isLoading` | `boolean` | Carregando `/api/auth/me` |
| `logout()` | `() => Promise<void>` | Faz logout e navega para `/` |
| `refreshUserData()` | `() => Promise<void>` | Re-busca `/api/auth/me` |

Uso: `const { user, isLoading, logout } = useUserHook();`

### useGovbrAuth — `src/hooks/useGovbrAuth.ts`

Fluxo de login Gov.br.

| Retorno | Tipo | Descrição |
|---------|------|-----------|
| `isLoading` | `boolean` | Em processamento |
| `error` | `string \| null` | Mensagem de erro |
| `loginWithGovbr(code)` | `(code: string) => Promise<{ user, token } \| null>` | Troca código por sessão; persiste em localStorage |
| `logout()` | `() => void` | Limpa localStorage e vai para `/` |

## Candidaturas e Aulas

### useEnrollments — `src/hooks/useEnrollments.ts`

Carrega candidaturas e aulas disponíveis em paralelo.

| Retorno | Tipo |
|---------|------|
| `enrollments` | `EnrollmentRequest[]` |
| `classes` | `Class[]` (aulas disponíveis) |
| `loading` | `boolean` |
| `error` | `string \| null` |
| `refetch()` | `() => Promise<void>` |

Parâmetro: `params?: EnrollmentListParams` (`{ professorId?, userId?, status?, schoolId? }`).

### useEnrollmentMutations — `src/hooks/useEnrollment.ts`

Ações de mutação sobre candidaturas.

| Retorno | Tipo | Descrição |
|---------|------|-----------|
| `createEnrollment({ classId })` | `Promise<EnrollmentRequest>` | Criar candidatura |
| `approveEnrollment(id)` | `Promise<EnrollmentRequest>` | Aprovar |
| `rejectEnrollment(id, reason?)` | `Promise<EnrollmentRequest>` | Rejeitar |
| `cancelEnrollment(id)` | `Promise<EnrollmentRequest>` | Cancelar |
| `loading` | `boolean` | Ação em andamento |
| `error` | `string \| null` | Erro da última ação |

> Os métodos re-lançam erros para que a view possa tratá-los (ex.: toast).

## Limite de Substituições

### useSubstitutionLimit — `src/hooks/useSubstitutionLimit.ts`

Calcula o saldo de substituições aprovadas do professor no semestre.

| Retorno | Tipo | Descrição |
|---------|------|-----------|
| `current` | `number` | Substituições aprovadas no semestre |
| `limit` | `number \| null` | Limite do professor |
| `percentage` | `number` | Percentual usado |
| `canApply` | `boolean` | Pode se candidatar |
| `loading` | `boolean` | Carregando |
| `error` | `string \| null` | Erro |

Parâmetro: `userId?: number | string`. Detalhes em [limite-substituicoes.md](../04-modulos/limite-substituicoes.md).

## Área Master

### useMasterDashboard — `src/hooks/useMasterDashboard.ts`

Carrega `DashboardStats` (escolas, aulas disponíveis, substituições do mês).

| Retorno | Tipo |
|---------|------|
| `stats` | `DashboardStats \| null` |
| `loading` | `boolean` |
| `error` | `string \| null` |

### useSchools — `src/hooks/useSchools.ts`

CRUD de escolas com estado + toasts.

| Retorno | Tipo |
|---------|------|
| `schools` | `School[]` |
| `loading` | `boolean` |
| `error` | `string \| null` |
| `getSchools()` / `createSchool(data)` / `updateSchool(id, data)` / `deleteSchool(id)` | funções |

### useUsers — `src/hooks/useUsers.ts`

Gestão de usuários por perfil (2 = diretor, 3 = administrador).

| Retorno | Tipo |
|---------|------|
| `users` | `User[]` |
| `createUser(data)` | `Promise<User>` |
| `unlinkUser(id)` | `Promise<User>` |
| `loading` / `error` | `boolean` / `string \| null` |

### useTeachers — `src/hooks/useTeachers.ts`

Professores vinculados/disponíveis e candidaturas de uma escola.

| Retorno | Tipo |
|---------|------|
| `linkedTeachers` | `Teacher[]` |
| `availableTeachers` | `Teacher[]` |
| `enrollmentRequests` | `EnrollmentRequest[]` |
| `loading` / `error` | `boolean` / `string \| null` |
| `fetchLinkedTeachers()` / `fetchAvailableTeachers()` / `fetchEnrollmentRequests(status?)` | funções de busca |
| `linkTeacher(userId, schoolId)` / `unlinkTeacher(userId)` | vínculo |
| `updateEnrollmentStatus(id, 'APPROVED'\|'REJECTED')` | aprovar/rejeitar |

### useMaster — `src/hooks/useMaster.ts`

Helper de acesso (atualmente não usado pelas páginas — o guard está no layout master).

| Retorno | Tipo |
|---------|------|
| `isMaster` | `boolean` (`profileId === 1`) |
| `checkAccess()` | redireciona para `/login` ou `/dashboard` |