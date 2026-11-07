# Implementation Plan: Director Teacher Management

**Branch**: `006-director-teacher-management` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-director-teacher-management/spec.md`

## Summary

Adicionar funcionalidades de gestão de professores e visualização de candidaturas para Diretores. O diretor poderá vincular/desvincular professores à escola e approve/reject candidaturas de professores. A funcionalidade será adicionada como nova aba na área do Master (diretores).

## Technical Context

**Language/Version**: TypeScript (Next.js default)

**Primary Dependencies**: Next.js 15, React 18+, Axios, styled-components

**Storage**: N/A (frontend only)

**Testing**: Jest + React Testing Library

**Target Platform**: Web (Next.js App Router)

**Project Type**: Web application - extensão de área Master existente

**Performance Goals**: Lists load in <3s (SC-001, SC-003), actions complete in <2s (SC-002)

**Constraints**: Reutilizar padrões existentes do Master dashboard, manter compatibilidade com roles existentes

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Acessibilidade Universal (WCAG) | ✅ PASS | Interfaces devem seguir diretrizes WCAG |
| II. Arquitetura Modular | ✅ PASS | Separação: service/hook/component |
| III. Test-First | ✅ PASS | Escrever testes antes da implementação |
| IV. Padrão de Componentes | ✅ PASS | Usar styled-components, estrutura separada |
| V. Simplicity First | ✅ PASS | Começar com funcionalidades básicas |
| VI. Visualização com Mermaid | ✅ PASS | Incluir diagrama de fluxo |

## Project Structure

### Documentation (this feature)

```text
specs/006-director-teacher-management/
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
│   └── master/
│       ├── dashboard/   # Existing
│       ├── escolas/    # Existing
│       ├── diretores/  # Existing
│       ├── administradores/  # Existing
│       └── professors/       # NEW: Teachers management page
│           └── page.tsx
├── components/
│   └── MasterSidebar.tsx     # Modify: add "Professores" tab
├── services/
│   └── teacher.service.tsx   # NEW: Teachers API service
├── hooks/
│   └── useTeachers.ts        # NEW: Teachers logic hook
├── proxy.ts                  # Existing (auth guard; renomeado de middleware.ts no Next 16)
└── api.service.tsx           # Existing

tests/
├── unit/
│   ├── teacher.service.test.tsx  # NEW
│   └── useTeachers.test.tsx     # NEW
└── integration/
    └── teacher-flow.test.tsx    # NEW
```

**Structure Decision**: Web application - Next.js com App Router. Estrutura segue padrões existentes do projeto Master.

## Phase 0: Research

### Identified Unknowns

1. **API Endpoints**: Confirmar se endpoints GET /users, POST /users, PATCH /users suportam filtros schoolId e profileId
2. **Enrollment API**: Verificar se endpoint GET /enrollment-requests existe e suporta filtros schoolId e status
3. **User Profile IDs**: Confirmar se profileId=2 é Diretor e profileId=4 é Professor conforme especificação

### Research Tasks

1. **Verificar estrutura de endpoints existentes**
   - Revisar api.service.tsx para padrões de chamada
   - Confirmar formato de response para usuários

2. **Confirmar IDs de perfil**
   - profileId=2 → Diretor
   - profileId=4 → Professor

3. **Verificar estrutura de enrollment requests**
   - Nome do endpoint correto
   - Campos disponíveis (status, schoolId)

### Output: research.md

(A ser gerado após validação)