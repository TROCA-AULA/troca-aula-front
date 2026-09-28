# Testes Automatizados

Este documento descreve a estratégia de testes do frontend Troca-Aula.

## Stack de Testes

| Ferramenta | Papel |
|------------|-------|
| Vitest 4 | Test runner |
| @testing-library/react | Renderização e interação de componentes |
| @testing-library/jest-dom | Matchers de DOM |
| @testing-library/user-event | Simulação de eventos do usuário |
| MSW (msw) | Mock de requisições HTTP |
| jsdom | Ambiente DOM para os testes |

Configuração em `vitest.config.ts`.

## Como Executar

| Comando | Descrição |
|---------|-----------|
| `pnpm test` | Executa todos os testes uma vez |
| `pnpm test:watch` | Executa em modo watch |
| `pnpm test:coverage` | Executa com relatório de cobertura |
| `pnpm test <caminho>` | Executa um arquivo/rodada específica |

Exemplo:
```bash
pnpm test src/user/useUserHook.test.tsx
```

## Arquivos de Teste

Os testes ficam em `tests/` (unit/integration) e ao lado do código (`src/**/*.test.tsx`). Alguns exemplos:

| Arquivo | O que cobre |
|---------|-------------|
| `src/api.service.test.tsx` | Interceptors do axios (request/response, toast de erro) |
| `src/proxy.test.ts` | Proxy de autenticação (rotas públicas, redirect sem token) |
| `src/app/page.test.tsx` | Página de login |
| `src/app/cadastro/page.test.tsx` | Página de cadastro |
| `src/app/dashboard/page.test.tsx` | Dashboard legado |
| `src/app/components/Logo.test.tsx` | Componente Logo |
| `src/user/useUserHook.test.tsx` | Hook de sessão (fetch `/api/auth/me`, logout) |

> O arquivo `test_output.txt` na raiz é um artefato de execução passada.

## Configuração

- `vitest.config.ts` define ambiente `jsdom`, alias `@` → `./src`, e limites de cobertura (100% global).
- `src/test-setup.ts` importa `@testing-library/jest-dom`.
- A configuração de cobertura exclui rotas de API do Next (`src/app/api/**`) e o layout raiz.

## Boas Práticas

1. **Teste o comportamento, não a implementação**: interaja via `userEvent` e verifique com queries de acesso (getByRole, getByLabelText, etc.).
2. **Mocks de API**: use MSW (`server.use(...)`) para simular as rotas do backend; evite chamadas reais.
3. **Cobertura**: o projeto mira 100% de cobertura para hooks e serviços críticos.
4. **Teste de erro**: cubra tanto o fluxo feliz quanto os fluxos de erro (toast de erro, redirect).

## Exemplo de Teste com MSW

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/auth/me', () => HttpResponse.json({ id: 1, name: 'Ana' })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ... teste
```

## Cobertura Atual

O status de cobertura e quais áreas ainda precisam de testes está documentado em [estado-atual.md](../06-status/estado-atual.md) e [roadmap.md](../06-status/roadmap.md).