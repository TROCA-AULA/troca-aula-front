---

description: "Task list for Gov.br OAuth2 Integration feature"

---

# Tasks: Gov.br OAuth2 Integration

**Input**: Design documents from `/specs/005-govbr-oauth/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Required - Constitution mandates Test-First approach

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization - BotaoGovBr.tsx already exists

- [x] T001 Verify existing BotaoGovBr.tsx component in src/components/
- [x] T002 Verify existing api.service.tsx in src/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Define TypeScript interfaces for auth API responses in src/types/auth.ts
- [x] T004 [P] Create auth service for API calls in src/services/auth.service.tsx (depends on T003)
- [x] T005 [P] Create auth hook for login logic in src/hooks/useGovbrAuth.ts (depends on T004)
- [x] T006 Verify existing middleware.ts supports JWT authentication (arquivo hoje `src/proxy.ts`, renomeado no Next 16)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Login with Gov.br (Priority: P1) 🎯 MVP

**Goal**: Usuário clica no botão, é redirecionado para Gov.br, retorna com código, troca por token e acessa dashboard

**Independent Test**: Usuário acessa página de login, clica no botão Gov.br, é redirecionado para autenticação Gov.br, retorna ao sistema autenticado

### Tests for User Story 1 (REQUIRED - Test-First) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Write unit test for authService.getGovbrAuthUrl in tests/unit/auth.service.test.tsx
- [x] T008 [P] [US1] Write unit test for authService.loginWithGovbr in tests/unit/auth.service.test.tsx
- [x] T009 [P] [US1] Write unit test for useGovbrAuth hook in tests/unit/useGovbrAuth.test.tsx
- [x] T010 [US1] Write integration test for OAuth2 flow in tests/integration/govbr-flow.test.tsx

### Implementation for User Story 1

- [x] T011 [P] [US1] Update BotaoGovBr.tsx to call authService.getGovbrAuthUrl in src/components/BotaoGovBr.tsx
- [x] T012 [US1] Create callback page to handle OAuth2 code in src/app/auth/govbr-callback/page.tsx (depends on T011)
- [x] T013 [US1] Integrate useGovbrAuth hook to exchange code for token in src/app/auth/govbr-callback/page.tsx (depends on T012)
- [x] T014 [US1] Save JWT token and redirect to dashboard in src/app/auth/govbr-callback/page.tsx (depends on T013)
- [x] T014b [US1] Validate state parameter and prevent code replay in src/hooks/useGovbrAuth.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Fallback to Traditional Login (Priority: P1)

**Goal**: Quando Gov.br falha, usuário pode fazer login tradicionalmente com email/senha

**Independent Test**: Simulando falha na autenticação Gov.br, verificar que o formulário de login tradicional continua disponível

### Tests for User Story 2 (REQUIRED - Test-First) ⚠️

- [x] T015 [P] [US2] Write test for error state handling in tests/unit/useGovbrAuth.test.tsx

### Implementation for User Story 2

- [x] T016 [US2] Add error handling in callback page to display friendly error message in src/app/auth/govbr-callback/page.tsx
- [x] T017 [US2] Ensure login page (src/app/page.tsx) maintains traditional login form visible during Gov.br errors

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Error Handling (Priority: P2)

**Goal**: Sistema trata erros de forma amigável e orienta o usuário

**Independent Test**: Simulando diferentes cenários de erro (rede, código expirado), verificar mensagens exibidas

### Tests for User Story 3 (REQUIRED - Test-First) ⚠️

- [x] T018 [P] [US3] Write test for network error handling in tests/unit/useGovbrAuth.test.tsx

### Implementation for User Story 3

- [x] T019 [US3] Add loading state display during authentication in src/app/auth/govbr-callback/page.tsx
- [x] T020 [US3] Handle invalid/expired code error with retry option in src/app/auth/govbr-callback/page.tsx
- [x] T021 [US3] Add timeout handling for authentication flow in src/hooks/useGovbrAuth.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 [P] Add accessibility attributes (aria-labels) to Gov.br button in src/components/BotaoGovBr.tsx
- [x] T023 Run build to verify no errors: pnpm build
- [x] T024 Run tests to verify all pass: pnpm test
- [x] T025 Validate against quickstart.md implementation steps
- [ ] T025a Measure SC-001: Auth flow completes in <30s (add logging/timing) - Backend metric
- [ ] T025b Measure SC-004: Error handling displays in <2s (add timing) - Backend metric
- [ ] T025c Document SC metrics as monitoring KPIs (not implementation tasks)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent from US1, but integrates with same components
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 error handling

### Within Each User Story

- Tests (REQUIRED) MUST be written and FAIL before implementation
- Types before services
- Services before hooks
- Hooks before UI integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All test tasks for a user story marked [P] can run in parallel
- User Stories 1 and 2 can be worked on in parallel (different components)
- User Story 3 can run in parallel with polish tasks

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit test for authService.getGovbrAuthUrl in tests/unit/auth.service.test.tsx"
Task: "Write unit test for authService.loginWithGovbr in tests/unit/auth.service.test.tsx"
Task: "Write unit test for useGovbrAuth hook in tests/unit/useGovbrAuth.test.tsx"

# Launch all implementation for User Story 1:
Task: "Update BotaoGovBr.tsx to call authService.getGovbrAuthUrl in src/components/BotaoGovBr.tsx"
Task: "Define TypeScript interfaces for auth API responses in src/types/auth.ts"
Task: "Create auth service for API calls in src/services/auth.service.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Write tests for Phase 3: User Story 1
4. Implement Phase 3: User Story 1
5. **STOP and VALIDATE**: Test User Story 1 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Write and fail tests for User Story 1 → Implement → Test independently → Deploy/Demo (MVP!)
3. Write and fail tests for User Story 2 → Implement → Test independently → Deploy/Demo
4. Write and fail tests for User Story 3 → Implement → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3 + Polish
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests MUST be written and FAIL before implementing (Constitution: Test-First)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence