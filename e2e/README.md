# Testes de ponta a ponta (E2E) — Playwright

Testam o sistema **inteiro**: o navegador (Chromium) usa as telas do front, o
front fala com o backend de verdade e o backend grava num PostgreSQL com RLS
ligado. Nada é simulado (mock).

Os testes unitários (`pnpm test`, vitest) continuam sendo a base; o E2E cobre
o que só aparece com tudo junto: login com cookie, regras do servidor
refletidas na tela, vários perfis no mesmo fluxo.

## Como rodar

Pré-requisitos (os mesmos do desenvolvimento):

- Docker com o container `postgres_container` ligado (ou um `psql` na máquina);
- o repositório do backend ao lado do front (`../troca-aula-backend`) com
  `pnpm install` feito;
- uma vez só: `pnpm exec playwright install chromium`.

```bash
pnpm run e2e          # roda tudo (sobe banco, backend e front sozinho)
pnpm run e2e:ui       # modo interativo (tipo Cypress): escolhe o teste, vê passo a passo
pnpm run e2e:ver      # abre o navegador e roda devagar, um teste por vez
pnpm run e2e:report   # abre o relatório da última rodada
pnpm exec playwright test e2e/fluxo-aula.spec.ts   # um arquivo só
pnpm exec playwright test -g "cancela"             # pelo nome do teste
pnpm exec playwright test --headed                 # vendo o navegador
```

O `pnpm run e2e`, sozinho:

1. **recria do zero** o banco `troca_aula_e2e` (migrations + papel do RLS +
   SQL base com o MASTER) — `e2e/scripts/subir-backend.sh`;
2. compila e sobe o backend na porta **5055**;
3. compila o front em `.next-e2e` (pasta própria, não mexe no `.next`) e
   sobe na porta **3055** — `e2e/scripts/subir-front.sh`;
4. roda os testes em paralelo e desliga tudo no fim.

Ele **nunca** toca no banco de desenvolvimento (`troca_aula`): o script se
recusa a apagar um banco cujo nome não termine em `_e2e` ou `_ci`.

Se o backend e o front de teste já estiverem rodando nas portas 5055/3055,
o Playwright reaproveita (bom para repetir rápido enquanto escreve teste).
Para subir só uma vez à mão:

```bash
E2E_SKIP_BACKEND_BUILD=1 bash e2e/scripts/subir-backend.sh &
E2E_SKIP_FRONT_BUILD=1 bash e2e/scripts/subir-front.sh &
```

Variáveis opcionais estão no cabeçalho de cada script (porta, nome do banco,
usuário dono do Postgres, nome do container).

## O que está coberto (33 testes)

| Arquivo | Fluxos |
|---|---|
| `autenticacao.spec.ts` | Login certo/errado, sair, telas protegidas sem login, sessão vencida (D19), cadastro pela tela, e-mail repetido, troca de senha |
| `fluxo-aula.spec.ts` | **Fluxo principal com 3 pessoas**: diretora publica a aula, dois professores se candidatam, ela aprova um e rejeita o outro com motivo (D15, D20); "Aulas aceitas" sem F5 (D14); cancelar candidatura; só a própria disciplina; remover aula; aviso de professor sem disciplina |
| `escola.spec.ts` | Vincular professor pelo e-mail, definir disciplina (vale sem sair e entrar — D23), limite de substituições, senha temporária que funciona, desvincular |
| `prioridade.spec.ts` | Grupo de prioridade criado pela tela muda quem vê a vaga; espera de quem está sem grupo; ordem de prioridade inválida recusada |
| `jornada-fechamento.spec.ts` | Lançar jornada, teto municipal de carga barra o excesso, professor vê a sua; fechamento gerar → revisar → fechar → reabrir com justificativa; nome do tipo de carga (D17); PDF baixado |
| `master.spec.ts` | Rede e escola pela tela, catálogo de disciplinas (criar, repetida, renomear, remover), nomear diretor e entrar com a senha temporária, diretor barrado na Área Master |
| `coordenador.spec.ts` | MASTER nomeia coordenador; ele entra, vê as escolas do município, cria escola, aprova candidatura; não vê outro município |
| `preferencias.spec.ts` | Município onde mora (sem contrato), aviso para quem tem contrato, excluir escola e desfazer |
| `navegacao.spec.ts` | Toda tela logada tem o menu lateral e o cabeçalho (professor e diretora navegam só pelo menu); item da tela atual marcado; no celular o menu abre como gaveta |

Gov.br não é testado (ainda não implementado).

## Como os testes são escritos

- **Cada teste cria os próprios dados** pela API (`criarCenario()` em
  `support/api.ts`: município, escola, disciplina, diretora e professores com
  um sufixo único). Por isso os testes rodam em paralelo e em qualquer ordem,
  e não dependem do banco estar vazio.
- **O que está sendo testado acontece pela tela.** A API só prepara o que
  não é o foco (ex.: criar a aula quando o teste é sobre a candidatura).
- **Várias pessoas no mesmo teste**: `abrirSessao(email)` (fixture em
  `support/fixtures.ts`) abre outro navegador, isolado, já logado.
- Seletores pelo que a pessoa vê: rótulo (`getByLabel`), papel e nome
  (`getByRole('button', { name })`), texto. Evite classes CSS.
- Helpers: `entrar()` (login rápido pela rota do próprio front), `aviso()`
  (toast), `linha()` (linha de tabela), `cartaoAula()` (cartão em `/classes`),
  `senhaTemporariaDoAviso()`.

```ts
import { test, expect } from './support/fixtures';
import { criarCenario } from './support/api';
import { aviso, entrar } from './support/sessao';

test('exemplo', async ({ page, abrirSessao }) => {
  const c = await criarCenario(1);
  await entrar(page, c.diretora.email, undefined, '/escola/professores');
  // ...
  const prof = await abrirSessao(c.professores[0].email, undefined, '/classes');
  await expect(prof.getByText(c.disciplina)).toBeVisible();
});
```

## Quando um teste falha

O Playwright guarda **print, vídeo e trace** de cada teste que falhou em
`test-results/`. O trace é o mais útil — mostra cada passo, a tela, a rede e
o console:

```bash
pnpm exec playwright show-trace test-results/<pasta-do-teste>/trace.zip
```

No CI (job `e2e` do `.github/workflows/test.yml`), esses arquivos ficam no
artefato **playwright-report** da execução.

## Defeitos que o E2E já achou

- O cabeçalho do painel (diretor/MASTER) empilhava os links numa faixa de
  60px e o **"Sair" ficava escondido atrás do conteúdo** — não dava para sair.
  Corrigido em `src/app/dashboard/page.tsx`.
- Em **/master/diretores** e **/master/administradores**, quem acabava de ser
  criado **não aparecia na tabela** até recarregar a página. Corrigido
  (`UserForm` avisa a página com `onCreated`).
