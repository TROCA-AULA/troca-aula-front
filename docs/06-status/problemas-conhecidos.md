# Problemas Conhecidos e Dívidas Técnicas

Lista consolidada de problemas identificados na análise do frontend.

## Críticos (afetam fluxo/segurança)

### P1 — Dois mapeamentos de `profileId` conflitantes
- **Módulo legado** (dashboard, `/api/auth/me`): `1` = admin, `2` = diretor, `3` = professor
- **Módulo master** (`/master/*`, `teacher.service`): `1` = master, `2` = diretor, `3` = administrador, `4` = professor
- **Impacto**: usuário pode ter acesso/permissão errados dependendo da página; a área master pode bloquear quem deveria ter acesso
- **Arquivos**: `src/app/dashboard/page.tsx`, `src/app/master/layout.tsx`, `src/services/teacher.service.tsx`

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

### P4 — Valores hardcoded
- Cadastro fixa `profileId: 3` e `schoolId: 1` → todos os novos usuários são "professor da escola 1"
- `/master/professores` fixa `schoolId = 'school-1'` (com TODO)
- **Arquivos**: `src/app/cadastro/page.tsx`, `src/app/master/professores/page.tsx`

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

### P11 — Log de payload do JWT
- `/api/auth/me` faz `console.log(payload)` — expõe dados do token nos logs

## Baixo (melhorias)

### P12 — Cobertura de testes incompleta
- Páginas/hooks/serviços novos sem testes (ver [testes.md](../02-guia-desenvolvimento/testes.md))

### P13 — Sem biblioteca de componentes / theming
- Estilos espalhados; cores `#509BA1`, `#6EC3C9`, etc. repetidas

### P14 — Cálculo de semestre client-side
- `useSubstitutionLimit` depende do relógio do navegador para definir o semestre

## Matriz Resumo

| ID | Severidade | Esforço | Área |
|----|-----------|---------|------|
| P1 | Crítico | Médio | Perfis/permissoes |
| P2 | Crítico | Médio | Autenticação |
| P3 | Crítico | Baixo | Segurança |
| P4 | Alto | Baixo | Cadastro/master |
| P5 | Alto | Baixo | Navegação |
| P6 | Alto | Médio | Segurança |
| P7 | Médio | Médio | Tipos |
| P8 | Médio | Médio | Qualidade |
| P9 | Médio | Baixo | Arquitetura |
| P10 | Médio | Baixo | Componentes |
| P11 | Médio | Trivial | Segurança/logs |
| P12 | Baixo | Médio | Testes |
| P13 | Baixo | Alto | UI |
| P14 | Baixo | Baixo | Limite |

## Como rastrear

- Itens P1–P6 devem virar Issues/GitHub Tasks com prioridade alta
- Itens P7–P14 podem ser tratados como dívida técnica em sprints
- Atualize este documento conforme os itens forem resolvidos