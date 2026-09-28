# Setup do Ambiente de Desenvolvimento

Este guia mostra como configurar e executar o frontend Troca-Aula localmente.

## Pré-requisitos

| Requisito | Versão | Verificação |
|-----------|--------|-------------|
| Node.js | 22.x | `node --version` |
| pnpm | 10.x | `pnpm --version` |
| Git | latest | `git --version` |
| Backend | rodando | Ver [troca-aula-backend](https://github.com/TROCA-AULA/troca-aula-backend) |

### Configuração do Node com nvm

```bash
nvm use 22
nvm alias default 22
```

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/TROCA-AULA/troca-aula-front.git
cd troca-aula-front
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
SECRET=s0//P4$$w0rD
```

> `SECRET` é opcional — o código usa o fallback `'s0//P4$$w0rD'` quando ausente. Deve coincidir com a chave usada pelo backend para assinar o JWT.

### 4. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
```

O servidor estará disponível em **http://localhost:3000**.

> ⚠️ O backend precisa estar rodando em `http://localhost:3001` (ou na URL definida em `NEXT_PUBLIC_API_URL`).

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Servidor de desenvolvimento (Turbopack) |
| `pnpm build` | Build de produção |
| `pnpm start` | Servidor de produção |
| `pnpm lint` | Lint (ESLint / Next lint) |
| `pnpm test` | Executa os testes (Vitest) |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm test:coverage` | Testes com relatório de cobertura |

## Estrutura de Pastas

```
troca-aula-front/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Login
│   │   ├── dashboard/         # Dashboard legado
│   │   ├── classes/           # Aulas disponíveis
│   │   ├── minhas-aulas/      # Minhas candidaturas
│   │   ├── master/            # Área administrativa (Master)
│   │   ├── auth/              # Callback Gov.br
│   │   ├── cadastro/          # Cadastro de usuários
│   │   └── api/               # API Routes (proxies)
│   ├── components/            # Componentes compartilhados
│   ├── hooks/                 # Hooks de lógica (controllers)
│   ├── services/              # Serviços de API
│   ├── types/                 # Tipos TypeScript
│   ├── user/                  # Hook e tipos de sessão
│   ├── lib/                   # Utilities (registry styled-components)
│   ├── api.service.tsx        # Cliente axios compartilhado
│   └── proxy.ts               # Guard de autenticação (valida o JWT)
├── docs/                      # Documentação do projeto
├── specs/                     # Specs Speckit (planos de implementação)
├── tests/                     # Testes de integração
└── .specify/                  # Configuração Speckit
```

## Troubleshooting

### Erro de dependências

```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Porta em uso

```bash
lsof -i :3000
pnpm dev -- -p 3002
```

### Backend indisponível (Network Error)

Confirme que o backend está rodando e que `NEXT_PUBLIC_API_URL` aponta para ele (por padrão `http://localhost:3001`).

### Erro de login (401)

- Confirme que o usuário existe no backend
- Confirme que `SECRET` do frontend corresponde ao segredo do backend (para a validação em `/api/auth/me`)
- Verifique os logs do backend em `/auth/login`