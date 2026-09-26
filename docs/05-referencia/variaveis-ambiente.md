# Referência: Variáveis de Ambiente

Variáveis usadas pelo frontend.

## Variáveis

| Variável | Onde é usada | Obrigatória | Padrão |
|----------|--------------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | `src/api.service.tsx` (axios `baseURL`) | ✅ | `http://localhost:5000` |
| `SECRET` | `src/app/api/auth/me/route.ts` (jose `jwtVerify`) | ❌ | `'s0//P4$$w0rD'` |
| `NODE_ENV` | rotas de login/logout (cookie `secure`) | — | definido pelo Next.js |

## `.env.local` atual (projeto)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Como configurar

Crie `.env.local` na raiz do projeto:

```env
# URL do backend NestJS
NEXT_PUBLIC_API_URL=http://localhost:3001

# Segredo do JWT (deve coincidir com o backend)
SECRET=s0//P4$$w0rD
```

## Detalhes

### NEXT_PUBLIC_API_URL

- Prefixo `NEXT_PUBLIC_` torna a variável disponível no browser
- Usada pelo interceptor do axios para montar a URL base de todas as chamadas ao backend
- Se não definida, assume `http://localhost:5000`

### SECRET

- Usada apenas em `/api/auth/me` para verificar o JWT com `jose.jwtVerify`
- Se ausente, usa o fallback `'s0//P4$$w0rD'`
- ⚠️ O token é **emitido pelo backend**; o segredo do frontend deve corresponder ao segredo de assinatura do backend, caso contrário `/api/auth/me` falha com 401

### NODE_ENV

- Controla o flag `secure` do cookie `token` (`true` apenas em produção)
- Em produção, o cookie só é enviado via HTTPS

## Variáveis que NÃO são usadas no frontend

- Credenciais do Gov.br (`CLIENT_ID`/`CLIENT_SECRET`): vivem **no backend**
- `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL`: pertencem ao backend

## Checklist de Deploy

- [ ] `NEXT_PUBLIC_API_URL` aponta para a URL pública do backend
- [ ] `SECRET` configurado e compatível com o backend
- [ ] Cookie `secure` ativo em produção (HTTPS)