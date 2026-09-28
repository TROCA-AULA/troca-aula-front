# Implementation Plan: Gov.br OAuth2 Integration

**Branch**: `005-govbr-oauth` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-govbr-oauth/spec.md`

## Summary

Completar integração OAuth2/OpenID Connect com Gov.br. O botão "Entrar com Gov.br" já existe (BotaoGovBr.tsx) mas apenas exibe um alert. O fluxo necessário: usuário clica no botão → redireciona para autenticação Gov.br → Gov.br retorna código de autorização → frontend troca código por token JWT → token é salvo e usuário redirecionado para dashboard. Se falhar, manter fallback para login tradicional.

## Technical Context

**Language/Version**: TypeScript (Next.js default)

**Primary Dependencies**: Next.js 15, React 18+, Axios, styled-components

**Storage**: N/A (frontend only)

**Testing**: Jest + React Testing Library

**Target Platform**: Web (Next.js App Router)

**Project Type**: Web application (frontend integration)

**Performance Goals**: Autenticação completa em menos de 30 segundos (SC-001), tratamento de erros em menos de 2 segundos (SC-004)

**Constraints**: Manter compatibilidade com login tradicional existente

**Scale/Scope**: Integração frontend para autenticação - endpoints de backend já existem (ou serão implementados em paralelo)

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Acessibilidade Universal (WCAG) | ✅ PASS | Botões e formulários devem ter labels acessíveis |
| II. Arquitetura Modular | ✅ PASS | Separação: service (API), hook (lógica), component (UI) |
| III. Test-First | ✅ PASS | Implementar testes antes de código de implementação |
| IV. Padrão de Componentes | ✅ PASS | Usar styled-components, estrutura de arquivos separada |
| V. Simplicity First | ✅ PASS | Começar com fluxo básico OAuth2, iterar conforme necessidade |
| VI. Visualização com Mermaid | ✅ PASS | Incluir diagrama de sequência do fluxo OAuth2 |

## Project Structure

### Documentation (this feature)

```text
specs/005-govbr-oauth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                    # Login page (existing)
│   └── auth/
│       └── govbr-callback/        # NEW: OAuth callback route
│           └── page.tsx
├── components/
│   └── BotaoGovBr.tsx             # Existing button (needs integration)
├── services/
│   └── auth.service.tsx            # NEW: Auth API service
├── hooks/
│   └── useGovbrAuth.ts             # NEW: Auth logic hook
├── proxy.ts                       # Existing (auth guard; renomeado de middleware.ts no Next 16)
└── api.service.tsx                # Existing (API client)

tests/
├── unit/
│   ├── auth.service.test.tsx      # NEW
│   └── useGovbrAuth.test.tsx      # NEW
└── integration/
    └── govbr-flow.test.tsx        # NEW
```

**Structure Decision**: Web application - Next.js com App Router. Estrutura segue padrões do projeto: services para API, hooks para lógica, components para UI.

## Phase 0: Research

### Identified Unknowns

1. **Backend endpoints**: Os endpoints `/auth/login-govbr` e `/auth/govbr-auth-url` estão implementados no backend? Precisa confirmar formato de resposta esperado.

2. **Token storage**: localStorage vs cookies httpOnly - qual abordagem usar para armazenar o JWT?

3. **Redirect URI**: Qual URL de callback está registrada no Gov.br para receber o código de autorização?

### Research Tasks

1. **Confirmar setup de endpoints backend**
   - Verificar se backend expõe endpoints necessários
   - Documentar formato de request/response

2. **Definir estratégia de token storage**
   - localStorage: mais simples, vulnerable a XSS
   - cookies httpOnly: mais seguro, requer server-side
   - Decisão: Usar cookies httpOnly para maior segurança (constitution principle)

3. **Verificar configuração Gov.br**
   - Redirect URI registrada
   - Escopo de permissões necessário

### Output: research.md

(A ser gerado após execução de research tasks)