# Referência: Componentes

Componentes reutilizáveis do frontend.

## `src/app/components/` — Componentes da Área Pública

### Logo — `src/app/components/Logo.tsx`

Marca "Troca ⇄ Aula".

| Prop | Tipo | Padrão |
|------|------|--------|
| `size` | `number` | `100` |

Usado nas páginas de login/cadastro e no header do dashboard.

## `src/components/` — Componentes Compartilhados

### BotaoGovBr — `src/components/BotaoGovBr.tsx`

Botão "Entrar com gov.br" (fundo azul `#1351B4`).

- Sem props
- Ao clicar: `authService.getGovbrAuthUrl()` → `window.location.href = url`

### ConfirmModal — `src/components/ConfirmModal.tsx`

Modal de confirmação para ações destrutivas.

| Prop | Tipo | Padrão |
|------|------|--------|
| `open` | `boolean` | — |
| `title` | `string` | — |
| `message` | `string` | — |
| `onConfirm` | `() => void` | — |
| `onCancel` | `() => void` | — |
| `confirmText` | `string` | `'Confirmar'` |
| `cancelText` | `string` | `'Cancelar'` |

### EnrollmentsList — `src/components/EnrollmentsList.tsx`

Tabela de candidaturas para gestão (admin/diretor).

| Prop | Tipo |
|------|------|
| `schoolId` | `number \| undefined` |

- Abas de filtro: Pendentes/Aprovadas/Rejeitadas
- Badges de status
- Ações: aprovar / rejeitar (rejeição pede motivo)
- Usa `useEnrollments` + `useEnrollmentMutations`

### StatCard — `src/components/StatCard.tsx`

Card de métrica simples.

| Prop | Tipo |
|------|------|
| `label` | `string` |
| `value` | `number \| string` |

Usado no dashboard master.

### SubstitutionCounter — `src/components/SubstitutionCounter.tsx`

Indicador visual do limite de substituições.

| Prop | Tipo |
|------|------|
| `current` | `number` |
| `limit` | `number \| null` |
| `percentage` | `number` |
| `loading` | `boolean` |

Cores: verde (`<80%`), amarelo (`>=80%`), vermelho (`>=100%`).

## Tema e paleta — `src/styles/theme.ts`

Fonte única das cores. Os componentes nunca usam cor fixa: só `theme.colors.*`
(nome pelo papel da cor) e `theme.tones.*` (etiquetas e avisos).

| Grupo | Tokens | Uso |
|---|---|---|
| Marca | `brand` (`#509BA1`, logo), `primary`/`primaryHover` | Botão principal, links, abas ativas |
| Verde-água claro | `primarySoft`, `primarySoftHover`, `primaryBorder` | Ações de linha ("Editar"), hover de botão secundário |
| Menu | `sidebar`, `sidebarText`, `sidebarSection`, `sidebarHover`, `sidebarActive` | Menu lateral |
| Texto | `text`, `textMuted`, `placeholder`, `onPrimary` | Títulos/corpo, texto secundário, texto sobre verde |
| Superfícies | `background`, `surface`, `surfaceAlt`, `overlay` | Fundo da página, cartões, faixas, fundo de modal |
| Bordas | `border`, `borderLight`, `borderStrong` | Cartões/divisórias, campos de formulário (3:1) |
| Tabelas | `tableHeader`, `tableHeaderText`, `rowHover` | Cabeçalho de toda tabela |
| Estados | `success*`, `warning*`, `danger*`, `info*` | Botões aprovar/rejeitar/excluir, avisos |
| Foco | `focus`, `focusRing` | Contorno de foco e brilho dos campos |

Etiquetas de status: `toneCss(tom)` (`src/styles/tones.ts`) aplica fundo, texto e
borda de `theme.tones.<tom>` (`primary`, `neutral`, `success`, `warning`, `danger`,
`info`). O status → tom fica em `src/constants/status-tones.ts`
(`ENROLLMENT_TONE`, `CLOSING_TONE`, `toneOf`).

## Moldura das telas logadas — `src/components/app-shell/`

`AppShell` envolve **toda** tela logada (cada rota tem um `layout.tsx` que o usa;
`/escola` e `/master` também, depois da checagem de acesso). Substituiu
`EscolaSidebar`, `MasterSidebar`, `MasterHeader` e o cabeçalho próprio do `/dashboard`.

| Arquivo | O que tem |
|---|---|
| `app-shell.view.tsx` | Estrutura: menu lateral + cabeçalho + conteúdo |
| `app-shell.controller.tsx` | `useAppShellController`: usuário, menu, gaveta aberta/fechada, contador |
| `app-shell.utils.tsx` | `buildMenu` (menu por perfil), `isActiveRoute`, `initialOf` |
| `app-shell.constants.tsx` | Itens de cada seção, textos, largura em que vira gaveta (900px) |
| `app-shell.styles.tsx` | styled-components, só com cores do `theme.ts` |

Menu por perfil:

| Perfil | Seções |
|---|---|
| Professor | Painel · Minhas aulas (aulas disponíveis, candidaturas, jornada, preferências) · Conta |
| Diretor / Auxiliar | Painel · Escola (professores, jornada, fechamento, indicadores, prioridade) · Conta |
| Coordenador municipal | Painel · Escola · Rede (escolas, redes, políticas, auditoria) · Conta |
| MASTER | Painel · Escola · Administração (Área Master e cadastros) · Conta |

Cabeçalho: escola ativa (`SchoolSelector`, só com mais de uma escola), contador de
substituições (professor com escola), `NotificationBell`, nome e perfil, "Sair".
O item da tela atual tem `aria-current="page"`; no celular o botão ☰ abre o menu.

## Formulários (Modal Forms)

### UserForm — `src/app/master/{diretores,administradores}/components/UserForm.tsx`

Modal para criar diretor/administrador.

| Prop | Tipo |
|------|------|
| `open` | `boolean` |
| `profileId` | `2 \| 3` |
| `schools` | `School[]` |
| `onClose` | `() => void` |

Campos: nome, email, telefone (opcional), escola (obrigatório).

> Duplicado em `diretores/` e `administradores/` — candidato a refatoração.

### SchoolForm — `src/app/master/escolas/components/SchoolForm.tsx`

Modal de criar/editar escola.

| Prop | Tipo |
|------|------|
| `open` | `boolean` |
| `mode` | `'create' \| 'edit'` |
| `initialData` | `School \| null` |
| `onClose` | `() => void` |

Campos: nome (obrigatório), `substitutionLimitPerSemester` (opcional).