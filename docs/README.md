# Troca-Aula — Documentação do Frontend

Bem-vindo à documentação técnica do **Troca-Aula Frontend**. Este índice organiza toda a documentação do projeto, que cobre visão de produto, guias de desenvolvimento, arquitetura, módulos, referência técnica e o status atual.

## Estrutura da Documentação

```
docs/
├── README.md                        # Este índice
├── 01-visao-geral/                  # Visão do produto e regras
│   ├── visao-do-produto.md          # Propósito, personas, diferenciais
│   ├── regras-de-negocio.md         # Regras R001-R014 e casos de erro
│   └── perfis-e-permissoes.md       # Perfis de usuário e matriz de acesso
├── 02-guia-desenvolvimento/         # Como desenvolver
│   ├── setup.md                     # Setup do ambiente
│   ├── convencoes.md                # Convenções de código
│   └── testes.md                    # Testes automatizados
├── 03-arquitetura/                  # Arquitetura técnica
│   ├── arquitetura.md               # Visão geral e padrões
│   ├── autenticacao.md              # Login, JWT, Gov.br e middleware
│   ├── integracao-backend.md        # Comunicação com o backend NestJS
│   └── modelo-de-dados.md           # Entidades e relacionamentos
├── 04-modulos/                      # Módulos/funcionalidades
│   ├── autenticacao.md              # Login, cadastro e Gov.br
│   ├── dashboard-aulas.md           # Aulas, candidaturas e minhas aulas
│   ├── area-master.md               # Área administrativa (Master)
│   └── limite-substituicoes.md      # Teto de substituições por semestre
├── 05-referencia/                   # Referência de código
│   ├── servicos.md                  # Serviços de API
│   ├── hooks.md                     # Hooks de lógica
│   ├── componentes.md               # Componentes compartilhados
│   ├── tipos.md                     # Tipos TypeScript
│   ├── rotas-api.md                 # Rotas do Next.js (API Routes)
│   └── variaveis-ambiente.md        # Variáveis de ambiente
└── 06-status/                       # Status do projeto
    ├── estado-atual.md              # O que está pronto
    ├── roadmap.md                   # Próximos passos
    └── problemas-conhecidos.md      # Problemas e dívidas técnicas
```

## Navegação Rápida

| Público | Comece por |
|---------|------------|
| **Novos membros** | [Visão do Produto](./01-visao-geral/visao-do-produto.md) → [Setup](./02-guia-desenvolvimento/setup.md) |
| **Desenvolvedores** | [Arquitetura](./03-arquitetura/arquitetura.md) → [Integração Backend](./03-arquitetura/integracao-backend.md) → [Referência](./05-referencia/servicos.md) |
| **QA / Testadores** | [Testes](./02-guia-desenvolvimento/testes.md) → [Estado Atual](./06-status/estado-atual.md) → [Problemas Conhecidos](./06-status/problemas-conhecidos.md) |
| **Gestores** | [Visão do Produto](./01-visao-geral/visao-do-produto.md) → [Estado Atual](./06-status/estado-atual.md) → [Roadmap](./06-status/roadmap.md) |

## Stack Resumida

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15.3.2 (App Router, Turbopack) |
| UI | React 19 + styled-components 6 |
| Formulários | react-hook-form + Yup |
| HTTP | Axios |
| Autenticação | JWT (jose), cookie httpOnly, Gov.br OAuth2 |
| Testes | Vitest + Testing Library + MSW |
| Package Manager | pnpm 10 |

## Repositórios Relacionados

| Repositório | Descrição |
|-------------|-----------|
| [troca-aula-front](https://github.com/TROCA-AULA/troca-aula-front) | Este projeto |
| [troca-aula-backend](https://github.com/TROCA-AULA/troca-aula-backend) | Backend NestJS + Prisma + PostgreSQL |

## Atualização da Documentação

- Documentação em **português (pt-BR)**
- Sempre que alterar uma funcionalidade, atualize a doc do módulo correspondente em `04-modulos/`
- Novas APIs/serviços devem ser refletidos em `05-referencia/servicos.md`
- Mudanças de infraestrutura/arquitetura devem ser refletidas em `03-arquitetura/`

---

**Última atualização**: 2026-08-18  
**Versão do projeto**: 0.1.0  
**Stack**: Next.js 15 + React 19 + styled-components + NestJS + PostgreSQL