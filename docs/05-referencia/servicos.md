# Referência: Serviços de API

Camada de acesso ao backend. Todos os serviços usam a instância axios compartilhada (`src/api.service.tsx`) e retornam `response.data?.data ?? response.data`.

## Cliente Compartilhado — `src/api.service.tsx`

```ts
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000' });
```

- **Request interceptor**: adiciona `Authorization: Bearer <token>` lido do cookie `token` (browser)
- **Response interceptor**: extrai `error.response.data.message` (string ou array) e mostra `toast.error`; re-lança o erro

## auth.service — `src/services/auth.service.tsx`

Fluxo Gov.br.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `getGovbrAuthUrl()` | `GET /auth/govbr-auth-url` | Retorna `{ url, state }` para redirecionar ao Gov.br |
| `loginWithGovbr(code, redirectUri)` | `POST /auth/login-govbr` | Troca `code` por `{ token, user, expires_in }` |

## enrollment.service — `src/services/enrollment.service.tsx`

Candidaturas e aulas disponíveis.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `getAvailableClasses()` | `GET /classes?available=true` | Aulas disponíveis (`Class[]`) |
| `getEnrollments(params?)` | `GET /enrollment-requests` | Candidaturas (filtros: userId, professorId, status, schoolId) |
| `getEnrollment(id)` | `GET /enrollment-requests/:id` | Detalhe de uma candidatura |
| `createEnrollment({ classId })` | `POST /enrollment-requests/request/:classId` | Criar candidatura (PENDING) |
| `approveEnrollment(id)` | `PATCH /enrollment-requests/:id/approve` | Aprovar candidatura |
| `rejectEnrollment(id, reason?)` | `PATCH /enrollment-requests/:id/reject` | Rejeitar (com `rejectionReason`) |
| `cancelEnrollment(id)` | `DELETE /enrollment-requests/:id` | Cancelar candidatura |

## master.service — `src/services/master.service.tsx`

CRUD de escolas e usuários para a área master.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `getSchools()` | `GET /schools` | Listar escolas |
| `getSchool(id)` | `GET /schools/:id` | Detalhar escola |
| `createSchool(data)` | `POST /schools` | Criar escola |
| `updateSchool(id, data)` | `PATCH /schools/:id` | Atualizar escola |
| `deleteSchool(id)` | `DELETE /schools/:id` | Excluir escola |
| `getUsers(profileId?, schoolId?)` | `GET /users?profileId=&schoolId=` | Listar usuários por perfil/escola |
| `createUser(data)` | `POST /users` | Criar usuário |
| `updateUser(id, data)` | `PATCH /users/:id` | Atualizar usuário |
| `unlinkUser(id)` | `PATCH /users/:id` | Desvincular (`{ schoolId: null }`) |
| `getClassesAvailable()` | `GET /classes?available=true` | Contar aulas disponíveis |
| `getSubstitutionsThisMonth()` | `GET /enrollment-requests?status=APPROVED` | Contar substituições do mês (filtra por `createdAt`) |
| `getDashboardStats()` | composto | `{ totalSchools, totalClassesAvailable, totalSubstitutionsThisMonth }` |

## teacher.service — `src/services/teacher.service.tsx`

Gestão de professores e candidaturas por escola (área master).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `getLinkedTeachers(schoolId)` | `GET /users?schoolId=&profileId=4` | Professores vinculados |
| `getAvailableTeachers()` | `GET /users?profileId=4` | Professores sem escola (filtra `!schoolId`) |
| `linkTeacher(userId, schoolId)` | `PATCH /users/:userId` | Vincular professor à escola |
| `unlinkTeacher(userId)` | `PATCH /users/:userId` | Desvincular (`{ schoolId: null }`) |
| `getEnrollmentRequests(schoolId, status?)` | `GET /enrollment-requests` | Candidaturas por status |
| `updateEnrollmentStatus(id, 'APPROVED'\|'REJECTED')` | `PATCH /enrollment-requests/:id/{approve\|reject}` | Aprovar/rejeitar |

## Chamadas diretas (fora dos services)

Algumas páginas chamam a API diretamente (não centralizadas em services):

| Onde | Chamada |
|------|---------|
| `page.tsx` (login) | `fetch('/api/auth/login')` |
| `useUserHook` | `fetch('/api/auth/me')`, `fetch('/api/auth/logout')` |
| dashboard | `axios.get('/api/classes', { params: { userId } })`, `axios.delete('/api/classes/:id')` |
| dashboard | `api.post('/classes', payload)` — cria aula direto no backend |
| dashboard | `api.post('/enrollment-requests/request/:id')` |
| dashboard | `api.get('/subjects')`, `api.get('/schools')`, `api.get('/schools/:id')` |
| cadastro | `api.post('/users')` |
| `useSubstitutionLimit` | `api.get('/users/:uid')`, `api.get('/enrollment-requests?...')` |

## Convenção de Uso

```ts
import { enrollmentService } from '@/services/enrollment.service';

const classes = await enrollmentService.getAvailableClasses();
```