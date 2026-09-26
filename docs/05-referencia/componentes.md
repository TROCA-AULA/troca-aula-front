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

## `src/app/master/components/` — Área Master

### MasterSidebar — `src/app/master/components/MasterSidebar.tsx`

Sidebar de navegação (250px) com itens: Dashboard, Escolas, Diretores, Administradores, Professores.

- Destaca a rota ativa via `usePathname`

### MasterHeader — `src/app/master/components/MasterHeader.tsx`

Barra de cabeçalho da área master.

| Prop | Tipo | Padrão |
|------|------|--------|
| `title` | `string` | `'Área Administrativa'` |

> ⚠️ **Não é importado por nenhuma página** — o layout master usa apenas o `MasterSidebar`.

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