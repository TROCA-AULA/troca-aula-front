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

- `vitest.config.ts` define ambiente `jsdom`, alias `@` → `./src`, e limites de cobertura **mínimos de 90% globais** (statements, branches, functions e lines) — o CI roda `pnpm run test:coverage` e falha se cair abaixo disso.
- `src/test-setup.ts` importa `@testing-library/jest-dom`.
- A configuração de cobertura exclui boilerplate sem comportamento próprio: layout raiz (`src/app/layout.tsx`), `src/lib/registry.tsx` (styled-components no Next) e as rotas de API que são só repasse fino (`api/auth/{me,logout,login}` e `api/classes/**`).

## Boas Práticas

1. **Teste o comportamento, não a implementação**: interaja via `userEvent` e verifique com queries de acesso (getByRole, getByLabelText, etc.).
2. **Mocks de API**: use MSW (`server.use(...)`) para simular as rotas do backend; evite chamadas reais.
3. **Cobertura**: mínimo de **90% global** (statements/branches/functions/lines), buscando o máximo possível perto de 100% — hoje o projeto está em 98,6% de statements e 99,1% de linhas.
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

Medição de 28/09/2026 (`pnpm run test:coverage`): **84 arquivos / 619 testes**, com **98,56% de statements, 92,79% de branches, 98,59% de functions e 99,05% de lines**. O mínimo de 90% é exigido no CI; o que ainda não está coberto está listado em [problemas-conhecidos.md](../06-status/problemas-conhecidos.md) (branches comprovadamente inalcançáveis, ex.: guardas de SSR no `SchoolContext`).