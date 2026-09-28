# Troca Aula — Frontend

Interface web do **Troca Aula**, plataforma para gerenciamento de substituições de professores em redes municipais de ensino (evitando aulas vagas). Faz parte da evolução multi-tenant do projeto — contexto completo em [`../docs/design-doc-evolucao-multi-tenant.md`](../docs/design-doc-evolucao-multi-tenant.md).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **styled-components** (tema central em `src/styles/theme.ts`)
- **axios** — chamadas do navegador via proxy interno (`/api/proxy/*`), que anexa o cookie `httpOnly` de sessão
- **react-hook-form + yup**, **react-toastify**
- **Vitest + Testing Library** (170 testes)

## Como rodar

Pré-requisito: backend rodando (ver `../troca-aula-backend/README.md`).

```bash
pnpm install
cp .env.example .env.local   # se aplicável; aponte para o backend
pnpm dev                     # http://localhost:3000
```

Comandos úteis:

```bash
pnpm test        # Vitest
pnpm run lint    # ESLint (flat config do Next 16)
pnpm run build   # build de produção
```

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/app` | Rotas (App Router): `/` (login), `/cadastro`, `/dashboard`, `/classes`, `/minhas-aulas`, `/escola/*` (jornada, fechamento de ponto, indicadores), `/master/*` (redes, escolas, políticas, professores, auditoria), `/minha-jornada`, `/alterar-senha` |
| `src/contexts` | `SchoolContext` — sessão única, escola/perfil/rede ativos |
| `src/hooks` / `src/services` | Acesso a dados (hooks de tela e services por domínio) |
| `src/components` | Componentes compartilhados (`ui/AdminTable`, `NotificationBell`, `ErrorBoundary`, …) |
| `src/types` | Contratos da API |

## Documentação

Consulte a documentação completa na pasta `docs/`:

- [docs/README.md](docs/README.md) - Índice da documentação
- [docs/01-visao-geral/](docs/01-visao-geral/) - Visão do produto, regras de negócio e perfis
- [docs/02-guia-desenvolvimento/](docs/02-guia-desenvolvimento/) - Setup, convenções e testes
- [docs/03-arquitetura/](docs/03-arquitetura/) - Arquitetura, autenticação e integração
- [docs/04-modulos/](docs/04-modulos/) - Módulos do sistema
- [docs/05-referencia/](docs/05-referencia/) - Referência de código (serviços, hooks, componentes, tipos, rotas, env)
- [docs/06-status/](docs/06-status/) - Estado atual, roadmap e problemas conhecidos
