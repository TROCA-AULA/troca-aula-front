# Módulo: Área Master (Administrativa)

A área master é o painel de administração global, acessível apenas pelo perfil **Master** (`profileId === 1`).

## Estrutura de Rotas

```
/master/
├── layout.tsx            # Guard de acesso + sidebar + header
├── page.tsx              # Redireciona para /master/dashboard
├── dashboard/            # Estatísticas
├── escolas/              # CRUD de escolas
├── disciplinas/          # Catálogo global de disciplinas (só MASTER)
├── diretores/            # Gestão de diretores
├── administradores/      # Gestão de administradores
└── professores/          # Gestão de professores + candidaturas
```

## Layout e Guarda (`src/app/master/layout.tsx`)

- Renderiza `AppShell` (menu lateral + cabeçalho comuns a todas as telas logadas, ver `docs/05-referencia/componentes.md`) + children
- Se `user.profileId !== 1`:
  - Sem usuário → redirect `/login`
  - Perfil errado → redirect `/dashboard`

## Páginas

### Dashboard (`/master/dashboard`)

- Exibe `StatCard`s com métricas via `useMasterDashboard`
- Métricas (`DashboardStats`):
  - Total de escolas (`GET /schools`)
  - Aulas disponíveis (`GET /classes?available=true`)
  - Substituições do mês (`GET /enrollment-requests?status=APPROVED` filtrado pelo mês atual)

### Escolas (`/master/escolas`)

- Tabela: ID, nome, limite de substituições por semestre, data de criação
- Ações: criar (modal `SchoolForm`), editar, excluir (`ConfirmModal`)
- Hook: `useSchools` → `masterService` (getSchools, createSchool, updateSchool, deleteSchool)

### Disciplinas (`/master/disciplinas`)

- Só MASTER (fora de `COORDINATOR_MASTER_ROUTES`; o coordenador não vê o item no menu)
- Tabela com nome; ações: criar, **Renomear** (edição na linha; Enter salva, Esc cancela) e **Remover** (`ConfirmModal`)
- Recusa no cliente nome repetido (sem diferenciar maiúsculas)
- Remover é lógico no backend: some das listas, mas quem já tinha a disciplina continua com ela
- Serviço: `masterService.getSubjects/createSubject/renameSubject/deleteSubject` (`/subjects`)

### Diretores (`/master/diretores`)

- Lista via `useUsers(2)` → `GET /users?profileId=2`
- Ações: criar (modal `UserForm`), "Desvincular" (unlink — seta `schoolId: null`)
- Tabela: ID, nome, email, telefone, escola

### Administradores (`/master/administradores`)

- Lista via `useUsers(3)` → `GET /users?profileId=3`
- Mesmas ações e modal `UserForm`

### Professores (`/master/professores`)

Duas abas:

1. **Professores**: professores vinculados à escola (`useTeachers` com `schoolId` fixo `'school-1'` — TODO no código)
   - Vincular/desvincular professores (`teacherService.linkTeacher/unlinkTeacher`)
2. **Candidaturas**: enrollment requests filtradas por status
   - Aprovar/rejeitar (`teacherService.updateEnrollmentStatus`)

## Formulários

| Componente | Arquivo | Campos |
|------------|---------|--------|
| `SchoolForm` | `src/app/master/escolas/components/SchoolForm.tsx` | nome (obrigatório), rede de ensino (obrigatório). A antiga janela de prioridade foi removida: a prioridade agora é por grupos, em `/escola/prioridade` |
| `UserForm` | `src/app/master/{diretores,administradores}/components/UserForm.tsx` | nome, email, telefone (opcional), escola (obrigatório) |

## Hooks e Serviços

| Recurso | Arquivo |
|---------|---------|
| `useMasterDashboard` | `src/hooks/useMasterDashboard.ts` |
| `useSchools` | `src/hooks/useSchools.ts` |
| `useUsers` | `src/hooks/useUsers.ts` |
| `useTeachers` | `src/hooks/useTeachers.ts` |
| `masterService` | `src/services/master.service.tsx` |
| `teacherService` | `src/services/teacher.service.tsx` |

## Diagrama de Acesso

```mermaid
flowchart TB
    A[Acessa /master] --> L{layout guard}
    L -->|profileId !== 1| R[Redirect /dashboard ou /login]
    L -->|profileId === 1| S[AppShell + página]
    S --> D[Dashboard]
    S --> E[Escolas]
    S --> DIR[Diretores]
    S --> ADM[Administradores]
    S --> PROF[Professores]
```

## Pontos de Atenção

1. **`schoolId` hardcoded** em `/master/professores` (`'school-1'`), com TODO para vir da sessão.
2. **Dois `UserForm` idênticos** duplicados (diretores e administradores) — candidato a refatoração.
3. Menu e cabeçalho vêm do `AppShell` (`src/components/app-shell/`); a seção "Administração" do menu só aparece para o MASTER.
4. **Mapeamento de perfis novo**: `1` = master, `2` = diretor, `3` = administrador, `4` = professor (diverge do dashboard legado).