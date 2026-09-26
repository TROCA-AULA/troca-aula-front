# Perfis de Usuário e Permissões

Este documento detalha os perfis de usuário, como são usados no frontend e a matriz de permissões por área do sistema.

## Perfis de Usuário

O sistema possui 4 perfis:

| ID | Nome | Papel no sistema |
|----|------|------------------|
| 1 | **Master** | Administrador global: gerencia escolas, diretores, administradores e professores |
| 2 | **Diretor** | Governa uma escola específica: cria vagas, aprova candidaturas, gerencia professores |
| 3 | **Administrador** | Coordena operações da escola: cria vagas, aprova/rejeita candidaturas |
| 4 | **Professor** | Busca aulas disponíveis e se candidata a vagas |

## Como o Frontend Usa os Perfis

### Área Master (`/master/*`) — mapeamento novo
A área master utiliza `profileId` com a seguinte lógica:

| Código | Perfil | Onde é usado |
|--------|--------|--------------|
| `profileId === 1` | Master | Guard de acesso da área master (`src/app/master/layout.tsx`) |
| `useUsers(2)` | Diretores | Página `/master/diretores` |
| `useUsers(3)` | Administradores | Página `/master/administradores` |
| `profileId: 4` | Professores | Página `/master/professores`, `teacher.service.tsx` |

### Módulo legado (dashboard) — mapeamento antigo

| `profileId` | Perfil no código legado |
|-------------|------------------------|
| 1 | Admin (área master) |
| 2 | Diretor (cria aulas no dashboard) |
| 3 | Professor (vê contador de substituições, se candidata) |

> ⚠️ **Inconsistência crítica**: o dashboard legado trata `profileId 3` como professor, enquanto o módulo master trata `profileId 3` como administrador e `4` como professor. Essa divergência está documentada em [problemas-conhecidos.md](../06-status/problemas-conhecidos.md).

## Matriz de Permissões (Área Master)

| Ação | MASTER | DIRETOR | ADMIN | PROFESSOR |
|------|--------|---------|-------|-----------|
| **Gestão do Sistema** | | | | |
| Criar/Editar/Excluir Escolas | ✅ | ❌ | ❌ | ❌ |
| Gerenciar Diretores | ✅ | ❌ | ❌ | ❌ |
| Gerenciar Administradores | ✅ | ❌ | ❌ | ❌ |
| Gerenciar Professores (vincular/desvincular) | ✅ | ✅ | ❌ | ❌ |
| Aprovar/Rejeitar Candidaturas | ✅ | ✅ | ✅ | ❌ |
| **Gestão de Aulas** | | | | |
| Criar Aula Vaga | ❌ | ✅ | ✅ | ❌ |
| Excluir Aula Vaga | ❌ | ✅ | ✅ | ❌ |
| **Candidaturas** | | | | |
| Candidatar-se a uma aula | ❌ | ✅ | ✅ | ✅ |
| Cancelar a própria candidatura | ❌ | ✅ | ✅ | ✅ |
| Aprovar Candidatura | ❌ | ✅ | ✅ | ❌ |
| Rejeitar Candidatura (com motivo) | ❌ | ✅ | ✅ | ❌ |
| **Visualização** | | | | |
| Listar Aulas Disponíveis | ✅ | ✅ | ✅ | ✅ |
| Listar Minhas Candidaturas | ❌ | ✅ | ✅ | ✅ |
| Ver Dashboard Estatístico | ✅ | ❌ | ❌ | ❌ |

> **Nota**: o MASTER pode executar qualquer ação no sistema. É o perfil com privilégios totais.

## Fluxo de Acesso por Perfil no Frontend

```mermaid
flowchart TB
    INICIO[Usuário acessa] --> LOGIN{Tem token?}
    LOGIN -->|Não| REDIRECT[Redireciona para /]
    LOGIN -->|Sim| ME[GET /api/auth/me]
    ME --> PERFIL{profileId?}
    PERFIL -->|1 - Master| MASTER[/master]
    PERFIL -->|2/3 - Diretor/Admin| DASHBOARD[/dashboard ou /classes]
    PERFIL -->|4 - Professor| TEACHER[/classes ou /minhas-aulas]

    style PERFIL fill:#FF9800
    style MASTER fill:#9C27B0,color:#fff
    style DASHBOARD fill:#673AB7,color:#fff
    style TEACHER fill:#3F51B5,color:#fff
```

## Guardas Implementadas

| Guarda | Arquivo | Comportamento |
|--------|---------|---------------|
| Middleware global | `src/middleware.ts` | Verifica cookie `token`; redireciona para `/` se ausente |
| Área master | `src/app/master/layout.tsx` | Apenas `profileId === 1`; senão redireciona para `/login` ou `/dashboard` |
| Página de aulas | `src/app/classes/page.tsx` | Não autenticado → `/login`; master → `/master` |
| Página minhas aulas | `src/app/minhas-aulas/page.tsx` | Não autenticado → `/login`; master → `/master` |