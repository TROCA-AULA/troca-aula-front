# Feature Specification: School Selection by User Profile

**Feature Branch**: `[003-school-profile-dynamic]`

**Created**: 2026-05-17

**Status**: Draft

> **Nota (2026-09):** esta spec é histórica — foi escrita assumindo um mapeamento de perfis (`1=Master, 2=Diretor, 3=Professor`) que **não** corresponde ao backend real (`1=DIRETOR, 2=AUXILIAR_ADMIN, 3=PROFESSOR, 4=MASTER`, ver `src/constants/profile.ts`). A implementação final seguiu o valor real; mantenha o documento como registro, sem usá-lo como referência de contrato.

**Input**: User description: "O formulário de criação de aula usa schoolId = 1 hardcoded. Precisa ser dinâmico baseado no perfil do usuário logado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Selects School from Dropdown (Priority: P1)

**Como** usuário Master,
**Eu quero** selecionar qualquer escola do sistema via dropdown,
**Para que** eu possa criar aulas para qualquer escola.

**Why this priority**: Master tem acesso a todas as escolas e precisa poder criar aulas para qualquer uma delas.

**Independent Test**: Pode ser testado efetuando login como Master, acessando o formulário de criação de aula e verificando que o dropdown mostra todas as escolas disponíveis.

**Acceptance Scenarios**:

1. **Given** o usuário Master está no formulário de criação de aula, **When** acessa o campo escola, **Then** vê um dropdown com todas as escolas do sistema
2. **Given** o Master selecionou uma escola no dropdown, **When** cria a aula, **Then** o schoolId correto é enviado no payload

---

### User Story 2 - Diretor/Admin Sees Fixed School (Priority: P1)

**Como** usuário Diretor ou Admin,
**Eu quero** visualizar minha escola já preenchida e bloqueada,
**Para que** eu possa criar aulas apenas para a minha escola.

**Why this priority**: Diretor e Admin devem criar aulas apenas para sua própria escola vinculada ao perfil.

**Independent Test**: Pode ser testado efetuando login como Diretor, acessando o formulário e verificando que o campo escola mostra o nome da escola desabilitado (readonly).

**Acceptance Scenarios**:

1. **Given** o usuário Diretor está no formulário de criação de aula, **When** visualiza o campo escola, **Then** vê o nome da escola vinculado ao seu perfil com campo desabilitado
2. **Given** o usuário Admin está no formulário de criação de aula, **When** visualiza o campo escola, **Then** vê o nome da escola vinculado ao seu perfil com campo desabilitado
3. **Given** o usuário Director/Admin cria uma aula, **When** enviar o formulário, **Then** o schoolId da escola vinculada é enviado automaticamente

---

### User Story 3 - Professor Cannot Create Classes (Priority: P1)

**Como** usuário Professor,
**Eu quero** acessar a página de criação de aulas apenas para visualizar (sem formulário),
**Para que** eu não tente criar aulas indevidamente.

**Why this priority**: Professores não têm permissão para criar aulas no sistema.

**Independent Test**: Pode ser testado efetuando login como Professor e verificando que não há formulário de criação de aula disponível.

**Acceptance Scenarios**:

1. **Given** o usuário Professor está logado, **When** tenta acessar o formulário de criação de aula, **Then** ou é redirecionado para outra página ou não vê o formulário de criação

---

### Edge Cases

- O que acontece quando o usuário Master não tem nenhuma escola cadastrada?
- O que acontece quando o usuário Diretor/Admin não tem schoolId vinculado ao seu perfil?
- O que acontece se o usuário tenta manipular o formulário via inspect HTML para enviar schoolId diferente?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir um dropdown com todas as escolas para usuários com perfil Master
- **FR-002**: O sistema DEVE exibir o campo escola desabilitado (readonly) com o nome da escola vinculada ao perfil para usuários com perfil Diretor
- **FR-003**: O sistema DEVE exibir o campo escola desabilitado (readonly) com o nome da escola vinculada ao perfil para usuários com perfil Admin
- **FR-004**: O sistema DEVE ocultar o formulário de criação de aula para usuários com perfil Professor (profileId=3)
- **FR-005**: O sistema DEVE enviar o schoolId correto no payload de criação de aula baseado no perfil do usuário
- **FR-006**: O sistema DEVE obter a lista de escolas via endpoint GET /schools
- **FR-007**: O sistema DEVE obter os dados do usuário logado (incluindo schoolId e profileId) via endpoint GET /auth/me

### Key Entities

- **Usuário (User)**: Representa o usuário logado, atributos: id, name, profileId, schoolId
- **Escola (School)**: Representa a escola do sistema, atributos: id, name
- **Aula (Class)**: Representa a aula a ser criada, atributos: schoolId, subjectId, date

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Master consegue visualizar todas as escolas no dropdown ao criar uma aula
- **SC-002**: Diretor/Admin visualiza o nome da escola vinculado ao perfil de forma bloqueada
- **SC-003**: Professor não tem acesso ao formulário de criação de aulas
- **SC-004**: 100% das aulas criadas contêm o schoolId correto baseado no perfil do usuário

## Assumptions

- Assume-se que o endpoint GET /auth/me retorna schoolId e profileId do usuário logado
- Assume-se que o endpoint GET /schools retorna todas as escolas cadastradas
- Assume-se que já existe uma página/formulário de criação de aula que precisa ser modificado
- Assume-se que os perfis são: 1=Master, 2=Diretor, 3=Professor (baseado no código existente)
- Assume-se que a biblioteca de UI (styled-components) já está disponível