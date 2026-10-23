# Perfis de Usuário e Permissões

> Atualizado em 23/10/2026. A fonte dos ids é `src/constants/profile.ts`, que espelha o backend. Quem decide de verdade é sempre o **servidor**: o frontend só esconde o que a pessoa não pode usar.

## Perfis

| ID | Nome | Papel no sistema |
|----|------|------------------|
| 1 | **DIRETOR** | Governa uma escola: cria vagas, aprova candidaturas, gerencia professores e a prioridade |
| 2 | **AUXILIAR_ADMIN** | Secretaria da escola: faz o mesmo que o diretor no dia a dia |
| 3 | **PROFESSOR** | Vê as aulas vagas da sua disciplina e se candidata |
| 4 | **MASTER** | Administrador global da plataforma |
| 5 | **COORDENADOR_MUNICIPAL** | Secretaria municipal: gere **todas** as escolas das redes que coordena |

Os perfis 1–4 vêm de vínculos com escolas (`UsersProfilesSchools`). O perfil 5 vem do vínculo com a rede (`UserNetworkLinks`); no login, o backend gera um vínculo de perfil 5 para **cada escola** da rede, por isso o coordenador aparece no seletor de escolas como gestor de todas elas.

**Hierarquia** (para conceder perfis ou mexer na conta de alguém): PROFESSOR < AUXILIAR_ADMIN < DIRETOR < COORDENADOR_MUNICIPAL < MASTER. Fora do MASTER, ninguém concede, remove ou altera perfil/conta de quem está no seu nível ou acima.

## Constantes e helpers

| Item | Arquivo | Uso |
|---|---|---|
| `PROFILE`, `PROFILE_LABELS` | `src/constants/profile.ts` | Ids e nomes. Nunca use número mágico |
| `STAFF_PROFILE_IDS` / `isSchoolScopedStaffProfile` | idem | Quem é gestão (tudo que não é professor) |
| `isCoordinatorOnly(links)` | idem | Tem perfil 5 e não é MASTER |
| `COORDINATOR_MASTER_ROUTES` | idem | Partes de `/master` que o coordenador pode abrir |
| `useCoordinatorOnly()` | `src/hooks/useCoordinatorOnly.ts` | O mesmo, a partir do `SchoolContext` |

## Matriz de permissões

| Ação | MASTER | COORD. | DIRETOR | AUXILIAR | PROFESSOR |
|------|:-:|:-:|:-:|:-:|:-:|
| Criar/editar redes, interconexões | ✅ | Só interconexões da sua rede | ❌ | ❌ | ❌ |
| Criar/editar escolas | ✅ | Na sua rede | ❌ | ❌ | ❌ |
| Excluir escolas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Catálogo de disciplinas (`/master/disciplinas`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Políticas de carga horária | ✅ | Na sua rede | ❌ | ❌ | ❌ |
| Auditoria da rede | ✅ | Da sua rede | ❌ | ❌ | ❌ |
| Nomear coordenadores, gerenciar diretores e administradores | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vincular/desvincular professor, definir disciplina e limite | ✅ | ✅ | ✅ | ✅ | ❌ |
| Grupos de prioridade da escola | ✅ | ✅ | ✅ | ✅ | ❌ |
| Criar/excluir aula vaga | ✅ | ✅ | ✅ | ✅ | ❌ |
| Aprovar/rejeitar candidatura | ✅ | ✅ | ✅ | ✅ | ❌ |
| Jornada, fechamento mensal, indicadores | ✅ | ✅ | ✅ | ✅ | Só a própria jornada |
| Candidatar-se / cancelar a própria candidatura | — | — | — | — | ✅ (só aulas da sua disciplina) |
| Preferências (redes de interesse, escolas excluídas, município onde mora) | — | — | — | — | ✅ |

Diretor, auxiliar e coordenador agem só nas escolas em que têm vínculo; o servidor responde 403 fora delas.

## Para onde cada perfil vai

```mermaid
flowchart TB
    INICIO[Usuário acessa] --> LOGIN{Tem token?}
    LOGIN -->|Não| REDIRECT[Redireciona para /]
    LOGIN -->|Sim| DASH[/dashboard]
    DASH -->|MASTER| MASTER["link Área Master → /master"]
    DASH -->|Coordenador| COORD["link Rede (município) → /master/escolas"]
    DASH -->|Diretor/Auxiliar| ESCOLA["/escola/* (Professores, Prioridade, Jornada...)"]
    DASH -->|Professor| TEACHER["/classes, /minhas-aulas, /minhas-preferencias"]
```

## Guardas

| Guarda | Arquivo | Comportamento |
|--------|---------|---------------|
| Proxy global | `src/proxy.ts` | Valida o JWT do cookie `token`; ausente/inválido → `/` |
| Área master | `src/app/master/layout.tsx` | MASTER: tudo. Coordenador: só `COORDINATOR_MASTER_ROUTES` (fora delas → `/master/escolas`), com a seção "Rede (município)" no menu do AppShell. Demais → `/dashboard` |
| Área da escola | `src/app/escola/layout.tsx` | MASTER ou gestão de escola (inclui o coordenador); professor → `/dashboard` |
| Aulas / minhas aulas | `src/app/classes/page.tsx`, `src/app/minhas-aulas/page.tsx` | Sem sessão → `/`; MASTER → `/master` |
