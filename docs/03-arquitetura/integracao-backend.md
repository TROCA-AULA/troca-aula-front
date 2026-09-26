# Integração com o Backend

Este documento descreve como o frontend se comunica com o backend NestJS.

## Configuração Básica

- O cliente axios compartilhado (`src/api.service.tsx`) usa:
  - `baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'`
- No ambiente local atual, `.env.local` define `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Interceptor de request: adiciona `Authorization: Bearer <token>` lido do cookie `token`
- Interceptor de response: mostra `toast.error` com a mensagem de erro do backend

## Dois Caminhos de Comunicação

### 1. Direto do browser (axios)

Usado pela maioria dos fluxos novos. O token vem do cookie via interceptor (ou do localStorage no caso Gov.br).

```
Browser → axios → Backend NestJS
```

Exemplos: `enrollment.service`, `master.service`, `teacher.service`, `auth.service`, `useSubstitutionLimit`.

### 2. Via API Routes do Next.js (proxy)

Usado quando o cookie httpOnly precisa ser lido no servidor (Server Components/Route Handlers) e repassado ao backend.

```
Browser → Next.js /api/* → Backend NestJS
```

Exemplos: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/classes`, `/api/classes/[id]`.

## Endpoints do Backend Usados pelo Frontend

### Autenticação

| Método | Endpoint | Onde é usado |
|--------|----------|--------------|
| POST | `/auth/login` | `/api/auth/login` (proxy) |
| GET | `/auth/govbr-auth-url` | `auth.service.getGovbrAuthUrl` |
| POST | `/auth/login-govbr` | `auth.service.loginWithGovbr` |

### Usuários

| Método | Endpoint | Onde é usado |
|--------|----------|--------------|
| POST | `/users` | cadastro, `masterService.createUser` |
| GET | `/users?profileId=&schoolId=` | `masterService.getUsers`, `teacherService` |
| GET | `/users/:id` | `useSubstitutionLimit` (limite por semestre) |
| PATCH | `/users/:id` | `masterService.updateUser`, `unlinkUser`, `teacherService.linkTeacher/unlinkTeacher` |

### Escolas

| Método | Endpoint | Onde é usado |
|--------|----------|--------------|
| GET | `/schools` | `masterService.getSchools`, dashboard |
| GET | `/schools/:id` | `masterService.getSchool`, dashboard |
| POST | `/schools` | `masterService.createSchool` |
| PATCH | `/schools/:id` | `masterService.updateSchool` |
| DELETE | `/schools/:id` | `masterService.deleteSchool` |

### Disciplinas

| Método | Endpoint | Onde é usado |
|--------|----------|--------------|
| GET | `/subjects` | dropdowns de criação de aula |

### Classes (Aulas)

| Método | Endpoint | Onde é usado |
|--------|----------|--------------|
| GET | `/classes?available=true` | `enrollmentService.getAvailableClasses`, `masterService.getClassesAvailable` |
| GET | `/classes` | `/api/classes` (proxy), dashboard |
| POST | `/classes` | dashboard (criação de aula) |
| PATCH | `/classes/:id` | `/api/classes/[id]` (proxy) |
| DELETE | `/classes/:id` | `/api/classes/[id]` (proxy), dashboard |

### Enrollment Requests (Candidaturas)

| Método | Endpoint | Onde é usado |
|--------|----------|--------------|
| GET | `/enrollment-requests` | `enrollmentService.getEnrollments`, `useSubstitutionLimit`, `teacherService.getEnrollmentRequests` |
| GET | `/enrollment-requests/:id` | `enrollmentService.getEnrollment` |
| POST | `/enrollment-requests/request/:classId` | `enrollmentService.createEnrollment` |
| PATCH | `/enrollment-requests/:id/approve` | `enrollmentService.approveEnrollment`, `teacherService.updateEnrollmentStatus` |
| PATCH | `/enrollment-requests/:id/reject` | `enrollmentService.rejectEnrollment`, `teacherService.updateEnrollmentStatus` |
| DELETE | `/enrollment-requests/:id` | `enrollmentService.cancelEnrollment` |

## Padrão de Resposta

O frontend lida com respostas com ou sem envelope `data`:

```ts
const response = await api.get('/schools');
return response.data?.data ?? response.data;
```

## Tratamento de Erros

| Código | Significado | Ação no frontend |
|--------|-------------|------------------|
| 200/201 | Sucesso | Exibe dados / toast de sucesso |
| 400 | Erro de validação | `toast.error` com a mensagem |
| 401 | Não autenticado | Login falha / redirect |
| 403 | Não autorizado | Toast de acesso negado |
| 404 | Não encontrado | Toast de não encontrado |
| 500 | Erro interno | Toast genérico |

O interceptor central de erro (em `api.service.tsx`) extrai `error.response.data.message` (string ou array) e mostra via `react-toastify`.

## CORS

O backend deve habilitar CORS para o origin do frontend:

```ts
// No NestJS
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

## Variáveis de Ambiente

| Variável | Onde | Uso |
|----------|------|-----|
| `NEXT_PUBLIC_API_URL` | frontend | URL base do backend |
| `SECRET` | frontend | Verificação do JWT em `/api/auth/me` |
| `JWT_SECRET` / `DATABASE_URL` | backend | Assinatura do token / banco |

## Status de Integração

| Funcionalidade | Frontend | Backend | Status |
|----------------|----------|---------|--------|
| Login (email/senha) | ✅ | ✅ | Completo |
| Logout | ✅ | ✅ | Completo |
| Cadastro | ✅ | ✅ | Completo |
| Listar/criar/excluir aulas | ✅ | ✅ | Completo |
| Candidatar-se | ✅ | ✅ | Completo |
| Aprovar/rejeitar/cancelar | ✅ | ✅ | Completo |
| Limite de substituições | ✅ | ✅ | Completo (semestre) |
| Gov.br OAuth | ✅ | ✅ | Parcial (inconsistência de sessão) |
| Área Master (escolas/usuários) | ✅ | ✅ | Completo |