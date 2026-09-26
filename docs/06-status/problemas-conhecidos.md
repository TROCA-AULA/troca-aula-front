# Problemas Conhecidos e Dívidas Técnicas

Lista consolidada de problemas identificados na análise do frontend.

> **Ver também:** [`design-doc-evolucao-multi-tenant.md`](../../../docs/design-doc-evolucao-multi-tenant.md) (raiz do projeto) — arquitetura proposta para multi-tenant (Fase 3 implementada nesta rodada).

## Críticos (afetam fluxo/segurança)

### P0 — Ausência total de contexto de tenant/escola ativa — ✅ Corrigido (Fase 3)
- Criado `src/contexts/SchoolContext.tsx` (`SchoolProvider` montado em `src/app/layout.tsx`): sessão carregada uma única vez, expõe `schoolLinks` (todos os vínculos escola/perfil do usuário — antes o `/api/auth/me` só devolvia o primeiro e nem incluía `schoolId`), `activeSchoolId`/`activeProfileId` e `setActiveSchoolId` (persistido em `localStorage`).
- Novo componente `src/components/SchoolSelector.tsx` — só aparece quando o usuário tem mais de um vínculo aprovado (hoje oculto na prática, já que a maioria dos usuários tem uma única escola).
- Migrados para `useSchoolContext()`: `dashboard/page.tsx`, `classes/page.tsx`, `minhas-aulas/page.tsx`, `master/layout.tsx`, `useMaster.ts`. `useUserHook` continua existindo (não removido) para eventuais usos futuros pontuais.

### P1 — Dois mapeamentos de `profileId` conflitantes — ✅ Corrigido (Fase 3)
- **Achado mais grave que o suspeitado**: NENHUM dos dois mapeamentos batia com o valor real do backend (`DIRETOR=1, AUXILIAR_ADMIN=2, PROFESSOR=3, MASTER=4`, confirmado em `profile.enum.ts`). Isso incluía um bug de autorização real: `useMaster.ts`/`master/layout.tsx` liberavam a área `/master/*` para `profileId===1` (na verdade DIRETOR) e bloqueavam o MASTER de verdade (`profileId===4`).
- Criado `src/constants/profile.ts` (`PROFILE.DIRETOR/AUXILIAR_ADMIN/PROFESSOR/MASTER`) como fonte única de verdade; todos os números mágicos substituídos (dashboard legado, guard da área master, `useMaster`, `useUsers`, `teacher.service`, `UserForm` de diretores/administradores, `types/master.ts`).
- **Arquivos**: ver diff completo na branch `v2` — praticamente todo arquivo que comparava `profileId` a um número literal foi tocado.

### P2 — Sessão Gov.br divergente
- Login tradicional: token no cookie httpOnly `token` (middleware reconhece)
- Login Gov.br: token e usuário no `localStorage` (`auth_token`, `user`)
- **Impacto**: após login Gov.br, o middleware não reconhece a sessão e redireciona para `/`; há dois mecanismos de sessão convivendo
- **Arquivos**: `src/hooks/useGovbrAuth.ts`, `src/middleware.ts`

### P3 — Senha com hash SHA1 (Base64) no cliente
- A senha é enviada como `Base64(SHA1(senha))` em vez de usar hash seguro (ex.: bcrypt no servidor)
- **Impacto**: fragilidade de segurança; a senha efetivamente trafega em forma derivada previsível
- **Arquivos**: `src/app/page.tsx`, `src/app/cadastro/page.tsx`, `src/app/api/auth/login/route.ts`

## Alto (correções necessárias)

### P4 — Valores hardcoded — ✅ Corrigido (Fase 3)
- `cadastro/page.tsx`: `profileId`/`schoolId` REMOVIDOS do payload (não só corrigidos) — o `CreateUserDto` real do backend não aceita esses campos (`ValidationPipe` com `forbidNonWhitelisted` rejeitaria com 400); o cadastro público hoje só cria o usuário base, o vínculo escola/perfil é feito depois via `assign-profile` por quem tem permissão.
- `/master/professores`: `schoolId = 'school-1'` substituído por `activeSchoolId` real do `SchoolContext`.
- **Novo achado (P15 abaixo)**: corrigir o hardcode não resolve um problema maior — o módulo de vínculo de professores (`teacher.service.tsx`/`useTeachers`) assume um contrato de API que o backend atual não implementa mais.

### P15 — Módulo de vínculo/criação de professores fora de contrato com o backend atual — ✅ Corrigido
- **Backend**: `GET /users` ganhou filtros reais opcionais `schoolId`/`profileId` (via `UsersProfilesSchools`, compatível retroativamente sem eles). Novo endpoint `POST /users/:id/unassign-profile` (contraparte de `assign-profile`, mesmas guardas `TenantGuard`+`RolesGuard`). **Bug adicional encontrado e corrigido**: `assign-profile` nunca setava `approvedAt`/`approvedById` — o vínculo criado nunca era considerado aprovado pelo `TenantContextService`, ou seja, o endpoint não concedia acesso nenhum na prática; agora o vínculo nasce aprovado com `approvedById` = quem chamou (validado end-to-end contra Postgres real).
- **Frontend**: `masterService.createUser` virou dois passos (`POST /users` com senha temporária gerada no cliente → `POST /users/:id/assign-profile`); se o segundo passo falhar, o erro é explícito (usuário criado mas sem vínculo). `teacherService.linkTeacher`/`unlinkTeacher` chamam `assign-profile`/`unassign-profile`. `getLinkedTeachers`/`getAvailableTeachers`/`getUsers` agora usam os filtros reais do servidor e achatam o shape `upsUser: [...]` da API para os tipos `Teacher`/`User` (campos planos `schoolId`/`profileId`) que as telas esperam.
- **Limitação aceita**: não há fluxo de convite/definição de senha por e-mail no backend — a senha temporária gerada precisa ser repassada manualmente pelo Master (mostrada em toast ao criar). Registrar como melhoria futura se o produto quiser um fluxo de convite de verdade.
- **Arquivos**: `troca-aula-backend/src/modules/users/{users.controller,users.service,users.repository}.ts` (+specs), `src/services/teacher.service.tsx`, `src/services/master.service.tsx`, `src/hooks/useTeachers.ts`, `src/hooks/useUsers.ts`, `src/types/master.ts` (+specs).

### P5 — Rota `/login` inexistente
- `/classes`, `/minhas-aulas` e o layout master redirecionam para `/login`, mas o login vive em `/`
- **Impacto**: redirect cai em 404 (o middleware também não trata `/login` como pública)

### P6 — Middleware não valida o JWT
- `src/middleware.ts` verifica apenas a **presença** do cookie `token`
- **Impacto**: cookie inválido/expirado passa pelo middleware; só `/api/auth/me` valida de fato

## Médio (dívidas técnicas)

### P7 — Tipos duplicados e heterogêneos
- `EnrollmentRequest` e `EnrollmentStatus` duplicados (`enrollment.ts` vs `teacher.ts`)
- `id` ora `number`, ora `string` (master/enrollment vs teacher)
- `Class.date` vs `statededAt` (typo persistido que virou contrato) — cast `as any` em `/classes`

### P8 — Uso extensivo de `any`/`@ts-ignore`
- ESLint desabilita regras (`no-explicit-any`, `ban-ts-comment`, etc.)
- Ex.: `payload?.sub?.upsUser` em `/api/auth/me`, `(classItem as any).statededAt` em `/classes`

### P9 — Criação de aula sem proxy
- Listagem usa `/api/classes` (proxy), mas criação (`api.post('/classes')`) vai direto ao backend
- Chamadas diretas espalhadas em páginas (dashboard, cadastro, `useSubstitutionLimit`) em vez de services

### P10 — Componentes duplicados
- `UserForm` idêntico em `diretores/` e `administradores/`
- `MasterHeader` criado mas não utilizado

### P11 — Log de payload do JWT — ✅ Corrigido (bônus, Fase 3)
- `console.log(payload)` removido de `/api/auth/me` ao reescrever essa rota para expor `schoolLinks` (P0).

## Baixo (melhorias)

### P12 — Cobertura de testes incompleta
- Páginas/hooks/serviços novos sem testes (ver [testes.md](../02-guia-desenvolvimento/testes.md))

### P13 — Sem biblioteca de componentes / theming
- Estilos espalhados; cores `#509BA1`, `#6EC3C9`, etc. repetidas

### P14 — Cálculo de semestre client-side
- `useSubstitutionLimit` depende do relógio do navegador para definir o semestre

## Matriz Resumo

| ID | Severidade | Esforço | Área | Status |
|----|-----------|---------|------|--------|
| P0 | Crítico | Alto | Multi-tenant/arquitetura | ✅ Corrigido (Fase 3) |
| P1 | Crítico | Médio | Perfis/permissoes | ✅ Corrigido (Fase 3) |
| P2 | Crítico | Médio | Autenticação | Pendente |
| P3 | Crítico | Baixo | Segurança | Pendente |
| P4 | Alto | Baixo | Cadastro/master | ✅ Corrigido (Fase 3) |
| P5 | Alto | Baixo | Navegação | Pendente |
| P6 | Alto | Médio | Segurança | Pendente |
| P7 | Médio | Médio | Tipos | Pendente |
| P8 | Médio | Médio | Qualidade | Pendente |
| P9 | Médio | Baixo | Arquitetura | Pendente |
| P10 | Médio | Baixo | Componentes | Pendente |
| P11 | Médio | Trivial | Segurança/logs | ✅ Corrigido (bônus) |
| P12 | Baixo | Médio | Testes | Pendente |
| P13 | Baixo | Alto | UI | Pendente |
| P14 | Baixo | Baixo | Limite | Pendente |
| P15 | Alto | Alto | Contrato API (master) | ✅ Corrigido |

## Como rastrear

- Itens P1–P6 devem virar Issues/GitHub Tasks com prioridade alta
- Itens P7–P14 podem ser tratados como dívida técnica em sprints
- Atualize este documento conforme os itens forem resolvidos