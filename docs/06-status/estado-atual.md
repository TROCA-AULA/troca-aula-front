# Estado Atual do Projeto

## Visão Geral

O frontend Troca-Aula tem as funcionalidades principais implementadas e testadas (P12 e P13 fechados). A verificação de 2026-10-22, feita com o sistema rodando, encontrou defeitos de tela e de integração; os graves foram corrigidos em 22–23/10 (telas novas: `/escola/professores`, `/master/coordenadores`, `/escola/prioridade` refeita e disciplina no `/cadastro`; menu do coordenador municipal). O que resta está listado — junto com o que é do backend — em [`docs/status-funcionalidades.md`](../../../docs/status-funcionalidades.md) (raiz do projeto), que passa a ser a fonte única de status.

```mermaid
pie title Progresso do Frontend
    "Funcionalidades implementadas" : 85
    "Funcionalidades parciais" : 10
    "Pendências / dívidas técnicas" : 5
```

## Funcionalidades Implementadas

### ✅ Autenticação
| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Login com email/senha | ✅ Completo | Senha enviada em texto puro sob TLS (sem pré-hash no cliente, P3); cookie httpOnly |
| Cadastro de usuários | ✅ Completo | Validação Yup; sem `profileId`/`schoolId` no payload (P4) |
| Logout | ✅ Completo | Limpa cookie + estado |
| Sessão com cookies | ✅ Completo | `SchoolContext` + `/api/auth/me` |
| Proxy de proteção | ✅ Completo | Valida assinatura/expiração do JWT (`jose.jwtVerify`); ausente ou inválido → `/` (P6) |
| Login Gov.br | ⏸️ Só no front | Botão, callback e `POST /api/auth/govbr-session` prontos (P2), mas o **backend ainda é stub** (`/auth/govbr-auth-url` → 501): o login Gov.br **não funciona** de ponta a ponta |
| Alteração de senha | ✅ Completo | `/alterar-senha` (`PATCH /auth/change-password`); reset pelo gestor via `POST /users/:id/reset-password` (enviada por e-mail quando há SMTP) |
| Sessão com validade | ✅ Completo | Login vale 12h; renovado ao abrir/recarregar (`/api/auth/me?refresh=1` → `POST /auth/refresh`); aviso "Sua sessão expirou" no 401 |
| Catálogo de disciplinas | ✅ Completo | `/master/disciplinas` (MASTER) |
| Município onde mora | ✅ Completo | `/minhas-preferencias` → "Onde você mora" (`PATCH /users/:id {residenceNetworkId}`) |

### ✅ Gestão de Aulas e Candidaturas
| Funcionalidade | Status |
|----------------|--------|
| Criar aula vaga (dashboard) | ✅ Completo |
| Listar aulas disponíveis | ✅ Completo (matéria + grupos de prioridade + regra do município aplicados pelo servidor) |
| Candidatar-se a aula (`/classes`) | ✅ Completo |
| Minhas candidaturas (`/minhas-aulas`) | ✅ Completo |
| Aprovar/rejeitar candidaturas | ✅ Completo |
| Cancelar candidatura | ✅ Completo |
| Excluir aula | ✅ Completo |
| Busca/filtro de aulas | ✅ Completo |
| Limite de substituições por semestre | ✅ Completo (cálculo no servidor, P14) |
| Notificações in-app | ✅ Completo (novas vagas, aprovação/rejeição e candidaturas pendentes) |

### ✅ Área Master (Administrativa)
| Funcionalidade | Status |
|----------------|--------|
| Dashboard com estatísticas | ✅ Completo |
| CRUD de escolas | ✅ Completo |
| Gestão de diretores | ✅ Completo |
| Gestão de administradores | ✅ Completo |
| Gestão de professores + candidaturas | ✅ Completo (vínculo via `assign-profile`, sem escola hardcoded — P4/P15) |
| Auditoria por rede | ✅ Completo (`/master/auditoria`) |
| Redefinir senha de usuário | ✅ Completo |
| Guard de acesso por perfil | ✅ Completo |

### ✅ Interface
| Funcionalidade | Status |
|----------------|--------|
| Páginas de login/cadastro | ✅ Completo |
| Dashboard legado | ✅ Completo |
| Página de aulas disponíveis | ✅ Completo |
| Página minhas aulas | ✅ Completo |
| Minha jornada do professor | ✅ Completo (`/minha-jornada`, `GET /teacher-workload-records/me`) |
| Indicadores da escola | ✅ Completo (`/escola/indicadores`: coverage-stats + histórico + CSV/impressão) |
| Menu e cabeçalho | ✅ Moldura única (`AppShell`) em todas as telas logadas: menu por perfil, nome real, sino e "Sair"; gaveta no celular |
| Notificações toast | ✅ Completo |
| Notificações in-app | ✅ Completo (`NotificationBell` + `useNotifications`) |
| Loading e erros padronizados | ✅ Completo (`Skeleton` nas telas novas + `ErrorBoundary` global no layout) |
| Logo customizado | ✅ Completo |

## Métricas do Código

| Métrica | Valor aproximado |
|---------|------------------|
| Páginas/rotas (App Router) | 20 (19 telas + redirect de `/master`) |
| Componentes compartilhados | ~11 |
| Hooks | ~19 |
| Services | 10 |
| API Routes (proxy) | 7 |
| Tipos TypeScript | ~20 interfaces |

## Testes

| Área | Status |
|------|--------|
| Suíte completa | ✅ 709/709 testes em 94 arquivos (cobertura ≥ 92,8% em todas as métricas; mínimo de 90% no CI) |
| Páginas cobertas | login/cadastro, dashboard legado, `/classes`, `/minhas-aulas`, `/alterar-senha`, `/master/{auditoria,dashboard,redes,diretores,administradores,escolas,professores,politicas-carga-horaria}`, `/minha-jornada`, `/escola/{indicadores,prioridade,fechamento-ponto,jornada-docente}`, `/minhas-preferencias` |
| Hooks/contextos cobertos | `SchoolContext`, `useUserHook`, `useNotifications`, `useGovbrAuth`, `useSubstitutionLimit`, `useSchools`, `useUsers`, `useTeachers`, `useEnrollments`, `useEnrollment`, `useMasterDashboard`, `useSubjects`, hooks de relatórios/fechamento/eligibility |
| Services cobertos | `auth`, `classes`, `enrollment`, `teacher`, `master`, `eligibility`, `account`, `indicators` |
| Pendentes | Nenhuma área sem teste (P12 fechado) |
| Cobertura | 98,6% statements / 92,8% branches / 98,6% funções / 99,1% linhas; mínimo de 90% exigido no CI |
| E2E (Playwright) | ✅ 33/33 contra backend + PostgreSQL reais (`pnpm run e2e`, ~30 s; job `e2e` no CI). Fluxos: login/sessão, cadastro, aula vaga com 3 perfis, gestão da escola, prioridade, jornada/fechamento, Área Master, coordenador, preferências, menu/cabeçalho em todas as telas. Ver [`e2e/README.md`](../../e2e/README.md) |

## Dependências Principais

- next: 16.3.6
- react / react-dom: 19.3.0
- styled-components: 6.1.18
- axios: 1.9.0
- react-hook-form: 7.56.4 / yup: 1.6.1
- vitest: 4.1.2
- jose: 6.0.11
- msw: 2.12.14

## Links Úteis

- **Frontend**: https://github.com/TROCA-AULA/troca-aula-front
- **Backend**: https://github.com/TROCA-AULA/troca-aula-backend
- **Especificações (specs)**: `specs/001` a `specs/007` no repositório

## Próximos Passos Imediatos

1. Commitar e publicar a `v2` na `main` (o trabalho de 22–23/10 está só na cópia local). Os defeitos D1–D24 estão todos corrigidos e as telas novas foram percorridas num navegador (ver `docs/status-funcionalidades.md`)
2. Gov.br de ponta a ponta (depende do backend)
3. Push notifications (o in-app e o e-mail já estão entregues)
4. App mobile e integração IoT (longo prazo, fora do escopo deste ciclo)

Mais detalhes em [roadmap.md](./roadmap.md) e [problemas-conhecidos.md](./problemas-conhecidos.md).
