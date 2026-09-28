# Problemas Conhecidos e Dívidas Técnicas

Lista consolidada de problemas identificados na análise do frontend.

> **Ver também:** [`design-doc-evolucao-multi-tenant.md`](../../../docs/design-doc-evolucao-multi-tenant.md) (raiz do projeto) — arquitetura proposta para multi-tenant (Fase 3 implementada nesta rodada).

## Críticos (afetam fluxo/segurança)

### P0 — Ausência total de contexto de tenant/escola ativa — ✅ Corrigido (Fase 3)
- Criado `src/contexts/SchoolContext.tsx` (`SchoolProvider` montado em `src/app/layout.tsx`): sessão carregada uma única vez, expõe `schoolLinks` (todos os vínculos escola/perfil do usuário — antes o `/api/auth/me` só devolvia o primeiro e nem incluía `schoolId`), `activeSchoolId`/`activeProfileId` e `setActiveSchoolId` (persistido em `localStorage`).
- Novo componente `src/components/SchoolSelector.tsx` — só aparece quando o usuário tem mais de um vínculo aprovado (hoje oculto na prática, já que a maioria dos usuários tem uma única escola).
- Migrados para `useSchoolContext()`: `dashboard/page.tsx`, `classes/page.tsx`, `minhas-aulas/page.tsx`, `master/layout.tsx`, `useMaster.ts`. `useUserHook` foi mantido apenas como wrapper deprecated do `SchoolContext` (sem consumidores reais).

### P1 — Dois mapeamentos de `profileId` conflitantes — ✅ Corrigido (Fase 3)
- **Achado mais grave que o suspeitado**: NENHUM dos dois mapeamentos batia com o valor real do backend (`DIRETOR=1, AUXILIAR_ADMIN=2, PROFESSOR=3, MASTER=4`, confirmado em `profile.enum.ts`). Isso incluía um bug de autorização real: `useMaster.ts`/`master/layout.tsx` liberavam a área `/master/*` para `profileId===1` (na verdade DIRETOR) e bloqueavam o MASTER de verdade (`profileId===4`).
- Criado `src/constants/profile.ts` (`PROFILE.DIRETOR/AUXILIAR_ADMIN/PROFESSOR/MASTER`) como fonte única de verdade; todos os números mágicos substituídos (dashboard legado, guard da área master, `useMaster`, `useUsers`, `teacher.service`, `UserForm` de diretores/administradores, `types/master.ts`).
- **Arquivos**: ver diff completo na branch `v2` — praticamente todo arquivo que comparava `profileId` a um número literal foi tocado.

### P2 — Sessão Gov.br divergente — ✅ Corrigido
- Antes: login tradicional gravava o token em cookie httpOnly (middleware reconhecia); login Gov.br gravava em `localStorage` (`auth_token`, `user`), que o middleware não reconhecia — usuário caía num loop de redirecionamento para `/` após autenticar via Gov.br.
- Correção: nova rota `POST /api/auth/govbr-session` (mesmo padrão de `/api/auth/login`) grava o JWT retornado pelo backend como cookie httpOnly. `useGovbrAuth.loginWithGovbr` chama essa rota em vez de escrever em `localStorage`; `logout` agora chama `POST /api/auth/logout` (mesma rota do login tradicional) em vez de limpar `localStorage`. Os dois fluxos de login passam a usar exatamente o mesmo mecanismo de sessão, lido por `/api/auth/me`/`SchoolContext` de forma idêntica.
- **Arquivos**: `src/app/api/auth/govbr-session/route.ts` (novo), `src/hooks/useGovbrAuth.ts`, `tests/unit/useGovbrAuth.test.tsx`

### P3 — Senha com hash SHA1 (Base64) no cliente — ✅ Corrigido
- Antes: `page.tsx` (login) e `cadastro/page.tsx` computavam `Base64(SHA1(senha))` no cliente antes de enviar. TLS + bcrypt com salt no servidor já são a defesa real; o pré-hash client-side era um valor determinístico equivalente à senha do ponto de vista do servidor, sem remover nenhum risco real.
- **Bug real descoberto durante a correção**: `masterService.createUser` (painel Master, criação de diretores/administradores) sempre mandou a senha temporária **crua** para `POST /users` (nunca fez o SHA1). Como o login sempre mandava `SHA1(senha)`, `bcrypt.compare` nunca batia para essas contas — **todo usuário criado pelo painel Master era incapaz de logar** (bug confirmado via E2E real contra Postgres, não só suíte mockada: criei um usuário assim, login retornava 401 com o código antigo).
- **Correção**: removido o SHA1/Base64 do frontend (login e cadastro passam a enviar a senha em texto puro, protegida por TLS). Backend (`AuthService.signIn`) migra contas antigas (`/cadastro` pré-correção, com bcrypt sobre SHA1) de forma lazy: tenta o esquema novo primeiro, cai pro esquema legado (recalculado no servidor) se não bater, e re-hasheia com bcrypt sobre a senha crua assim que loga com sucesso — nenhuma conta existente perde acesso.
- **Validação E2E real** (não só mocks): criei um usuário com hash legado, logei com a senha crua (sucesso via fallback), confirmei no Postgres que o hash mudou de esquema, logei de novo (sucesso via caminho rápido, sem fallback), confirmei senha errada continua rejeitada (401); criei um usuário "estilo painel Master" (senha crua) e confirmei que agora consegue logar — reproduzindo e corrigindo o bug real.
- **Arquivos**: `src/app/page.tsx`, `src/app/cadastro/page.tsx`, `troca-aula-backend/src/modules/auth/{auth.service.ts,auth.service.spec.ts}`.

## Alto (correções necessárias)

### P4 — Valores hardcoded — ✅ Corrigido (Fase 3)
- `cadastro/page.tsx`: `profileId`/`schoolId` REMOVIDOS do payload (não só corrigidos) — o `CreateUserDto` real do backend não aceita esses campos (`ValidationPipe` com `forbidNonWhitelisted` rejeitaria com 400); o cadastro público hoje só cria o usuário base, o vínculo escola/perfil é feito depois via `assign-profile` por quem tem permissão.
- `/master/professores`: `schoolId = 'school-1'` substituído por `activeSchoolId` real do `SchoolContext`.
- **Achado relacionado (P15, também corrigido)**: o módulo de vínculo de professores (`teacher.service.tsx`/`useTeachers`) assumia um contrato de API que o backend atual não implementava mais.

### P15 — Módulo de vínculo/criação de professores fora de contrato com o backend atual — ✅ Corrigido
- **Backend**: `GET /users` ganhou filtros reais opcionais `schoolId`/`profileId` (via `UsersProfilesSchools`, compatível retroativamente sem eles). Novo endpoint `POST /users/:id/unassign-profile` (contraparte de `assign-profile`, mesmas guardas `TenantGuard`+`RolesGuard`). **Bug adicional encontrado e corrigido**: `assign-profile` nunca setava `approvedAt`/`approvedById` — o vínculo criado nunca era considerado aprovado pelo `TenantContextService`, ou seja, o endpoint não concedia acesso nenhum na prática; agora o vínculo nasce aprovado com `approvedById` = quem chamou (validado end-to-end contra Postgres real).
- **Frontend**: `masterService.createUser` virou dois passos (`POST /users` com senha temporária gerada no cliente → `POST /users/:id/assign-profile`); se o segundo passo falhar, o erro é explícito (usuário criado mas sem vínculo). `teacherService.linkTeacher`/`unlinkTeacher` chamam `assign-profile`/`unassign-profile`. `getLinkedTeachers`/`getAvailableTeachers`/`getUsers` agora usam os filtros reais do servidor e achatam o shape `upsUser: [...]` da API para os tipos `Teacher`/`User` (campos planos `schoolId`/`profileId`) que as telas esperam.
- **Limitação aceita**: não há fluxo de convite/definição de senha por e-mail no backend — a senha temporária gerada precisa ser repassada manualmente pelo Master (mostrada em toast ao criar). Registrar como melhoria futura se o produto quiser um fluxo de convite de verdade.
- **Arquivos**: `troca-aula-backend/src/modules/users/{users.controller,users.service,users.repository}.ts` (+specs), `src/services/teacher.service.tsx`, `src/services/master.service.tsx`, `src/hooks/useTeachers.ts`, `src/hooks/useUsers.ts`, `src/types/master.ts` (+specs).

### P16 — Janela de prioridade não era aplicada na tela real de "Aulas Disponíveis" — ✅ Corrigido
- **Achado ao validar o guia de simulação contra Postgres real** (não pego pela suíte mockada): `GET /classes` recebia `userId` como um parâmetro de query **opcional, decidido pelo cliente** — `ClassesController.findAll` nunca lia `req.user.id`. A tela real que os professores usam (`/classes`, "Aulas Disponíveis", via `enrollmentService.getAvailableClasses`) nunca mandava esse parâmetro; só uma tela legada/duplicada (`dashboard/page.tsx`) mandava. Resultado: o filtro de matéria e a janela de prioridade da escola (`ClassesService.findAll`) **nunca eram aplicados na tela que realmente importa** — um professor externo via a vaga na listagem durante a janela de prioridade (a candidatura em si continuava sendo rejeitada com 403, defesa em profundidade que já existia em `EnrollmentRequestsService.create` e nunca foi afetada — mas a listagem mentia sobre o que ele podia fazer).
- **Corrigido**: `ClassesController.findAll` agora sempre injeta `req.user.id` como `userId`, nunca aceita do cliente — reproduzido e confirmado corrigido via `curl` real (professor vinculado vê a vaga, professor externo não vê mais, mesmo sem passar `userId` manualmente).
- **Efeito colateral encontrado e também corrigido antes de subir**: como isso faz `ClassesService.findAll` passar a rodar para TODO chamador (antes só rodava quando `userId` calhava de vir na query), um bug latente separado apareceu — o ramo que existia ali tratava MASTER igual a um gestor comum (DIRETOR/AUXILIAR_ADMIN), escopando-o ao `schoolId` do primeiro vínculo dele. Isso teria feito o próprio MASTER (que tem um vínculo formal na escola do bootstrap) parar de ver aulas de qualquer outra escola/rede na listagem global. Corrigido: MASTER agora é tratado num ramo separado, sem nenhum escopo de escola forçado.
- **Arquivos**: `troca-aula-backend/src/modules/classes/{classes.controller.ts,classes.service.ts,classes.service.spec.ts,classes.controller.spec.ts}`.

### P5 — Rota `/login` inexistente — ✅ Corrigido
- 5 pontos redirecionavam para `/login` (rota que nunca existiu — o login vive em `/`), resultando em 404: `minhas-aulas/page.tsx`, `classes/page.tsx`, `escola/layout.tsx`, `useMaster.ts`, `master/layout.tsx`. Todos corrigidos para `router.push('/')`, consistente com o próprio `proxy.ts`, que já redireciona pra `/` quando não há sessão válida.

### P6 — Guard não validava o JWT — ✅ Corrigido
- Antes: `src/middleware.ts` (hoje `src/proxy.ts`, renomeado no Next 16) verificava apenas a **presença** do cookie `token`; cookie inválido/expirado passava pelo guard e só era barrado em `/api/auth/me`.
- Correção: o proxy agora é assíncrono, valida assinatura e expiração do JWT com `jose.jwtVerify` (biblioteca já usada em `/api/auth/me`). Mesmo segredo/fallback de `/api/auth/me` (`process.env.SECRET`, já configurado). Token inválido/expirado agora redireciona para `/` E remove o cookie (evita loop de redirecionamento).
- **Arquivos**: `src/proxy.ts`, `src/proxy.test.ts`

## Médio (dívidas técnicas)

### P7 — Tipos duplicados e heterogêneos — ✅ Corrigido
- **`EnrollmentRequest`/`EnrollmentStatus`**: `types/teacher.ts` não redefine mais — re-exporta de `types/enrollment.ts` (fonte única). `enrollment.ts` ganhou campos opcionais (`schoolId`, `appliedAt`, `professor`, `user: EnrollmentCandidate`) só para não quebrar telas que já liam esse formato denormalizado — **nenhum endpoint real hoje devolve isso populado** (`GET /enrollment-requests` é flat, ver `EnrollmentRequestsRepository.findAll` no backend); a tela `/master/professores` (aba Candidaturas) sempre mostrou "-"/"0" nesses campos e continua assim — bug de dado ausente, não de tipo, registrado aqui mas não corrigido (exigiria o backend popular a relação, fora do escopo desta rodada).
- **`id` ora `number` ora `string`**: `Teacher.id`/`Teacher.schoolId` e as assinaturas de `teacherService`/`useTeachers` (`getLinkedTeachers`, `linkTeacher`, `unlinkTeacher`, `getEnrollmentRequests`, `updateEnrollmentStatus`) agora usam `number` (o formato real de `serial` do Postgres), eliminando as conversões `String(activeSchoolId)`/`Number(t.id)` nos 3 pontos de chamada (`master/professores`, `escola/jornada-docente`, `escola/fechamento-ponto`). `Subject.id` em `teacher.ts` também corrigido de `string` para `number` (`Subjects.id` é `serial` no schema do backend).
- **`Class.date` vs `statededAt`**: `Class.date` (campo que nunca existiu na resposta real do backend) removido; `Class.statededAt: string | null` é o único campo, batendo com `classes.statededAt` do schema Drizzle. `as any` removido de `/classes`.
- **P7-b — `UserData.id: string | number`** (`src/user/user.types.tsx`) — ✅ Corrigido também: confirmado via `/api/auth/me` (`src/app/api/auth/me/route.ts`) que `id` vem sempre de `sub.id` no JWT, sempre numérico (`Users.id` é `serial`); nenhum consumidor (`master/diretores`, `master/administradores`, `useSubstitutionLimit`, `services/master.service.tsx`) dependia da forma `string`. Estreitado para `id: number`.
- **Arquivos**: `src/types/enrollment.ts`, `src/types/teacher.ts`, `src/services/teacher.service.tsx`, `src/hooks/useTeachers.ts`, `src/app/classes/page.tsx`, `src/app/master/professores/page.tsx`, `src/app/escola/jornada-docente/page.tsx`, `src/app/escola/jornada-docente/components/WorkloadRecordForm.tsx`, `src/app/escola/fechamento-ponto/page.tsx`, `tests/unit/teacher.service.test.tsx`, `tests/unit/useTeachers.test.tsx`, `src/user/user.types.tsx`.

### P8 — Uso extensivo de `any`/`@ts-ignore` — ✅ Corrigido
- `@typescript-eslint/no-explicit-any` e `@typescript-eslint/ban-ts-comment` foram reativadas no `eslint.config.mjs` para o código de aplicação; continuam liberadas apenas em `tests/**` (mocks).
- Nenhum `any`/`@ts-ignore`/`@ts-nocheck` restante fora de testes (verificado em `src/`).

### P9 — Chamadas diretas ao backend fora dos services — ✅ Corrigido
- Cadastro e `useSubstitutionLimit` já usavam `api-client.service` (proxy `/api/proxy`); nesta rodada o dashboard legado (último ponto com chamadas diretas) foi migrado para `classesService` (`src/services/classes.service.tsx`) e `schoolsService` (`src/services/schools.service.tsx`).
- Não restam chamadas axios/fetch diretas ao backend em páginas/hooks; o único uso direto é o proxy server-side (`src/app/api/proxy/[...path]/route.ts`), que é o ponto de entrada esperado.

### P10 — Componentes duplicados — ✅ Corrigido
- `UserForm` (já era idêntico byte-a-byte entre `diretores/` e `administradores/`, já parametrizado por `profileId`) movido para `src/app/master/components/UserForm.tsx`; as duas páginas passaram a importar dali, cópias antigas removidas.
- `MasterHeader` estava criado mas nunca importado — confirmado via grep. Passou a ser usado em `master/layout.tsx` (entre a sidebar e o conteúdo), agora recebendo `userName` real de `useSchoolContext().user.name` em vez do placeholder hardcoded `"Master"`/`"M"`.
- **Arquivos**: `src/app/master/components/UserForm.tsx` (novo, movido), `src/app/master/diretores/page.tsx`, `src/app/master/administradores/page.tsx`, `src/app/master/components/MasterHeader.tsx`, `src/app/master/layout.tsx`.

### P11 — Log de payload do JWT — ✅ Corrigido (bônus, Fase 3)
- `console.log(payload)` removido de `/api/auth/me` ao reescrever essa rota para expor `schoolLinks` (P0).

## Baixo (melhorias)

### P12 — Cobertura de testes incompleta — ✅ Corrigido
- Todas as lacunas listadas foram cobertas: páginas `/classes`, `/minhas-aulas`, `/alterar-senha`, `/master/{auditoria,dashboard,redes,diretores,administradores,escolas,professores,politicas-carga-horaria}`, `/minha-jornada`, `/escola/{indicadores,prioridade,fechamento-ponto,jornada-docente}`, `/minhas-preferencias`; contextos/hooks `SchoolContext`, `useUserHook`, `useNotifications`, `useEnrollments`, `useEnrollment`, `useMasterDashboard`, `useSubjects`, `useMaster` e os demais hooks de dados; services `auth`, `classes`, `enrollment`, `teacher`, `master`, `eligibility`, `account`, `indicators`; `ErrorBoundary` e o helper de PDF. Suíte: **235 testes em 53 arquivos**, todos passando.
- Observação: segue sem meta de % de cobertura configurada (apenas 100% nas pastas cobertas) — decisão de qualidade, não lacuna de teste.

### P13 — Sem biblioteca de componentes / theming — ⚠️ Parcial (só telas antigas de autenticação/dashboard legado)
- Feito: tema central (`src/styles/theme.ts` + `src/components/ThemeProvider.tsx`, montado no layout raiz); primitivos de container/header/tabela/estados em `src/components/ui/AdminTable.tsx`; `Skeleton`/`SkeletonRows` em `src/components/ui/Skeleton.tsx`; `ErrorBoundary` global; migradas para AdminTable/tema/skeleton: `master/dashboard`, `master/redes`, `master/diretores`, `master/administradores`, `master/escolas`, `master/professores`, `master/politicas-carga-horaria`, `/classes` e `/minhas-aulas` (tokens de tema).
- Falta: dashboard legado (`/dashboard`, que concentra a maior parte dos estilos antigos e tende a ser substituído pelas telas novas) e as telas de autenticação (`/` e `/cadastro`).

### P14 — Cálculo de semestre client-side — ✅ Corrigido (backend + frontend)
- Achado original: `useSubstitutionLimit` calculava o semestre com o relógio do navegador (`getCurrentSemester()`) e recontava aprovações no cliente via `GET /enrollment-requests?createdAfter=...`. Investigação revelou um bug mais sério: o gate real do backend (`EnrollmentRequestsService.countApprovedSubstitutions`, chamado em `create()`) contava candidaturas **APPROVED da carreira inteira** do professor contra `substitutionLimitPerSemester`, sem nenhum recorte de data — a mensagem de erro já dizia "para este semestre", mas a contagem nunca foi escopada assim.
- **Correção real (backend é a fonte de verdade)**: `EnrollmentRequestsService` ganhou `getCurrentSemesterStart()` (UTC, jan/jul) e `countApprovedSubstitutions` passou a usar `createdAtGte` com esse limite — o gate de `create()` agora escopa por semestre de verdade. Novo endpoint `GET /enrollment-requests/substitution-limit/:professorId` devolve `{current, limit, percentage, canApply}` já calculado no servidor (autorização: o próprio professor, ou um gestor via `TenantContextService`/`MANAGER_PROFILES`).
- **Frontend**: `useSubstitutionLimit` reescrito para só consumir esse endpoint — zero cálculo de data no cliente, hook e backend não podem mais divergir porque é a mesma fonte.
- **Arquivos**: `troca-aula-backend/src/modules/enrollment-requests/{enrollment-requests.service.ts,enrollment-requests.controller.ts,enrollment-requests.service.spec.ts}`, `src/hooks/useSubstitutionLimit.ts`, `tests/unit/hooks/useSubstitutionLimit.test.ts` (novo).

## Matriz Resumo

| ID | Severidade | Esforço | Área | Status |
|----|-----------|---------|------|--------|
| P0 | Crítico | Alto | Multi-tenant/arquitetura | ✅ Corrigido (Fase 3) |
| P1 | Crítico | Médio | Perfis/permissoes | ✅ Corrigido (Fase 3) |
| P2 | Crítico | Médio | Autenticação | ✅ Corrigido |
| P3 | Crítico | Baixo | Segurança | ✅ Corrigido |
| P4 | Alto | Baixo | Cadastro/master | ✅ Corrigido (Fase 3) |
| P5 | Alto | Baixo | Navegação | ✅ Corrigido |
| P6 | Alto | Médio | Segurança | ✅ Corrigido |
| P7 | Médio | Médio | Tipos | ✅ Corrigido |
| P8 | Médio | Médio | Qualidade | ✅ Corrigido |
| P9 | Médio | Baixo | Arquitetura | ✅ Corrigido |
| P10 | Médio | Baixo | Componentes | ✅ Corrigido |
| P11 | Médio | Trivial | Segurança/logs | ✅ Corrigido (bônus) |
| P12 | Baixo | Médio | Testes | ✅ Corrigido (235/235) |
| P13 | Baixo | Alto | UI | ⚠️ Parcial (só dashboard legado e login/cadastro antigos) |
| P14 | Baixo | Baixo | Limite | ✅ Corrigido (backend + frontend) |
| P15 | Alto | Alto | Contrato API (master) | ✅ Corrigido |
| P16 | Alto | Baixo | Janela de prioridade (listagem) | ✅ Corrigido |

## Como rastrear

- P8 e P9 foram fechados nesta rodada; restam P12 (cobertura de testes) e P13 (migrar as telas antigas para o tema/componentes) como dívida técnica
- Atualize este documento conforme os itens forem resolvidos