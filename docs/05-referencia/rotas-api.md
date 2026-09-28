# Referência: Rotas do Next.js (API Routes)

O frontend expõe API Routes do Next.js que atuam como **proxy** para o backend. Elas são necessárias quando o token httpOnly (cookie) precisa ser lido no servidor.

## Rotas de API

### `POST /api/auth/login` — `src/app/api/auth/login/route.ts`

- Lê `{ email, password }` do corpo
- Chama `POST /auth/login` no backend (axios)
- Extrai `access_token` e grava o cookie httpOnly `token` (7 dias)
- Retorna `{ ok: true }` ou `401`

### `POST /api/auth/logout` — `src/app/api/auth/logout/route.ts`

- Limpa o cookie `token` (maxAge 0)

### `GET /api/auth/me` — `src/app/api/auth/me/route.ts`

- Lê o cookie `token` (ausente → `401`)
- Valida o JWT com `jose.jwtVerify` e `SECRET` (fallback `'s0//P4$$w0rD'`)
- Retorna `{ id, name, email, profileId }` (de `payload.sub` + `sub.upsUser[0]`)

### `GET /api/classes` — `src/app/api/classes/route.ts`

- Encaminha query params ao backend `GET /classes`
- Anexa `Authorization: Bearer <token do cookie>`
- Retorna `{ error: 'Ocorreu um erro ao buscar as classes.' }` em caso de erro (500)

### `PATCH /api/classes/[id]` — `src/app/api/classes/[id]/route.ts`

- Proxy `PATCH /classes/:id` com Bearer token do cookie
- `params` é assíncrono (`await params`)

### `DELETE /api/classes/[id]` — `src/app/api/classes/[id]/route.ts`

- Proxy `DELETE /classes/:id` com Bearer token do cookie

> **Nota**: não existe `POST /api/classes`; a criação de aula usa o proxy genérico (`/api/proxy/classes`, via `classesService`).

## Proxy — `src/proxy.ts`

> Nota histórica: `src/middleware.ts` foi renomeado para `src/proxy.ts` no Next 16.

- Matcher: todas as rotas exceto `_next/*`, `favicon.ico`, `images`, `api` e `api/*`
- Rotas públicas: `/`, `/cadastro`, `/api/login`, `/api/auth/me`, `/api/auth/logout`, `/api/classes`
- Nas demais: valida assinatura/expiração do JWT (`jose.jwtVerify`); cookie ausente/inválido → redirect `/`

```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api|api/.*).*)'],
};
```

## Tabela Resumo

| Método | Rota | Arquivo | Para onde vai |
|--------|------|---------|---------------|
| POST | `/api/auth/login` | `src/app/api/auth/login/route.ts` | `POST /auth/login` |
| POST | `/api/auth/logout` | `src/app/api/auth/logout/route.ts` | — (limpa cookie) |
| GET | `/api/auth/me` | `src/app/api/auth/me/route.ts` | — (valida JWT local) |
| GET | `/api/classes` | `src/app/api/classes/route.ts` | `GET /classes` |
| PATCH | `/api/classes/[id]` | `src/app/api/classes/[id]/route.ts` | `PATCH /classes/:id` |
| DELETE | `/api/classes/[id]` | `src/app/api/classes/[id]/route.ts` | `DELETE /classes/:id` |

## Observações de Segurança

- O payload do token não é mais logado em `/api/auth/me` (P11)
- O proxy valida o JWT (`jose.jwtVerify`); cookie ausente/inválido → redirect `/`
- Os proxies de classes não revalidam o token no servidor (o backend é responsável pela autorização)