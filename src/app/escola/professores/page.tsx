'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { teacherService } from '@/services/teacher.service';
import { accountService } from '@/services/account.service';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { Teacher, TeacherSearchResult } from '@/types/teacher';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  PageSubtitle,
  PrimaryButton,
  Table,
  Th,
  Td,
  ActionButton,
  EmptyState,
  LoadingState,
} from '@/components/ui/AdminTable';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { tempPasswordMessage } from '@/utils/temp-password';

// Defeito D8: o diretor não tinha tela para vincular professores à escola
// (só a do Master, que lista todo mundo). Aqui ele busca pelo e-mail de
// quem já se cadastrou, vincula como PROFESSOR, define disciplina (D9) e
// limite de substituições por semestre (D6), redefine senha e desvincula.

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px;
`;

const Hint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 12px;
`;

const Row = styled.form`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  min-width: 0;
`;

const SmallInput = styled(Input)`
  width: 96px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
`;

const ResultCard = styled.div`
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Warning = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
  display: block;
  margin-top: 4px;
`;

const DangerAction = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.onPrimary};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

interface RowDraft {
  subjectId: string;
  limit: string;
}

function toDraft(teacher: Teacher): RowDraft {
  return {
    subjectId: teacher.subjectId != null ? String(teacher.subjectId) : '',
    limit:
      teacher.substitutionLimitPerSemester != null
        ? String(teacher.substitutionLimitPerSemester)
        : '',
  };
}

export default function ProfessoresEscolaPage() {
  const { activeSchoolId } = useSchoolContext();
  const { linkedTeachers, loading, fetchLinkedTeachers } = useTeachers(
    activeSchoolId ?? 0,
  );
  const { subjects } = useSubjects();

  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<TeacherSearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [toUnlink, setToUnlink] = useState<Teacher | null>(null);

  useEffect(() => {
    const next: Record<number, RowDraft> = {};
    for (const teacher of linkedTeachers) next[teacher.id] = toDraft(teacher);
    setDrafts(next);
  }, [linkedTeachers]);

  const subjectName = (id?: number | null) =>
    subjects.find((subject) => subject.id === id)?.name;

  if (!activeSchoolId) {
    return (
      <PageContainer>
        <PageTitle>Professores da escola</PageTitle>
        <EmptyState>Selecione uma escola para gerenciar os professores.</EmptyState>
      </PageContainer>
    );
  }

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } catch {
      // a mensagem do backend já aparece no toast do api-client
    } finally {
      setBusy(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      setResult(await teacherService.findByEmail(email));
    } catch {
      setResult(null);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const alreadyLinked =
    result != null && linkedTeachers.some((teacher) => teacher.id === result.id);

  const handleLink = (person: TeacherSearchResult) =>
    run(async () => {
      await teacherService.linkTeacher(person.id, activeSchoolId);
      toast.success(`${person.name} agora é professor desta escola`);
      setResult(null);
      setEmail('');
      setSearched(false);
      await fetchLinkedTeachers();
    });

  const handleSave = (teacher: Teacher) => {
    const draft = drafts[teacher.id];
    if (!draft) return;
    const limit = draft.limit.trim() === '' ? null : Number(draft.limit);
    if (limit !== null && (!Number.isInteger(limit) || limit < 0)) {
      toast.error('O limite precisa ser um número inteiro (0 ou mais) ou ficar em branco');
      return;
    }
    return run(async () => {
      await teacherService.updateTeacher(teacher.id, {
        ...(draft.subjectId ? { subjectId: Number(draft.subjectId) } : {}),
        substitutionLimitPerSemester: limit,
      });
      toast.success(`Dados de ${teacher.name} salvos`);
      await fetchLinkedTeachers();
    });
  };

  const handleResetPassword = (teacher: Teacher) =>
    run(async () => {
      const { tempPassword, emailSent } = await accountService.resetUserPassword(teacher.id);
      toast.success(tempPasswordMessage(teacher.name, tempPassword, emailSent), {
        autoClose: false,
      });
    });

  const confirmUnlink = () => {
    const teacher = toUnlink;
    setToUnlink(null);
    if (!teacher) return;
    return run(async () => {
      await teacherService.unlinkTeacher(teacher.id, activeSchoolId);
      toast.success(`${teacher.name} foi desvinculado da escola`);
      await fetchLinkedTeachers();
    });
  };

  const updateDraft = (id: number, patch: Partial<RowDraft>) =>
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { subjectId: '', limit: '' }), ...patch },
    }));

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Professores da escola</PageTitle>
          <PageSubtitle>
            Vincule professores, defina a disciplina e o limite de substituições.
          </PageSubtitle>
        </div>
      </PageHeader>

      <Section>
        <SectionTitle>Vincular professor</SectionTitle>
        <Hint>
          A pessoa precisa ter se cadastrado antes (tela de cadastro). Busque pelo
          e-mail exato que ela usou.
        </Hint>
        <Row onSubmit={handleSearch}>
          <FormGroup style={{ flex: 1, minWidth: 220 }}>
            <Label htmlFor="search-email">E-mail do professor</Label>
            <Input
              id="search-email"
              type="email"
              value={email}
              placeholder="professor@exemplo.com"
              onChange={(e) => {
                setEmail(e.target.value);
                setSearched(false);
              }}
            />
          </FormGroup>
          <PrimaryButton type="submit" disabled={searching || !email.trim()}>
            {searching ? 'Buscando...' : 'Buscar'}
          </PrimaryButton>
        </Row>

        {searched && !searching && result == null && (
          <Hint style={{ marginTop: 12 }}>
            Nenhum cadastro com esse e-mail. Peça para a pessoa se cadastrar primeiro.
          </Hint>
        )}

        {result && (
          <ResultCard>
            <div>
              <strong>{result.name}</strong> — {result.email}
              <Hint style={{ margin: 0 }}>
                Disciplina: {subjectName(result.subjectId) ?? 'não informada'}
              </Hint>
            </div>
            {alreadyLinked ? (
              <Hint style={{ margin: 0 }}>Já é professor desta escola.</Hint>
            ) : (
              <PrimaryButton
                type="button"
                disabled={busy}
                onClick={() => handleLink(result)}
              >
                Vincular como professor
              </PrimaryButton>
            )}
          </ResultCard>
        )}
      </Section>

      <Section>
        <SectionTitle>Professores vinculados</SectionTitle>
        <Hint>
          Professor sem disciplina não vê nenhuma vaga. Limite em branco = sem
          limite de substituições no semestre.
        </Hint>

        {loading ? (
          <LoadingState>
            <SkeletonRows />
          </LoadingState>
        ) : linkedTeachers.length === 0 ? (
          <EmptyState>Nenhum professor vinculado a esta escola ainda.</EmptyState>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>E-mail</Th>
                  <Th>Disciplina</Th>
                  <Th>Limite/semestre</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {linkedTeachers.map((teacher) => {
                  const draft = drafts[teacher.id] ?? toDraft(teacher);
                  return (
                    <tr key={teacher.id}>
                      <Td>{teacher.name}</Td>
                      <Td>{teacher.email}</Td>
                      <Td>
                        <Select
                          aria-label={`Disciplina de ${teacher.name}`}
                          value={draft.subjectId}
                          onChange={(e) =>
                            updateDraft(teacher.id, { subjectId: e.target.value })
                          }
                        >
                          <option value="">Sem disciplina</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </Select>
                        {teacher.subjectId == null && (
                          <Warning>Não vê vagas até ter disciplina</Warning>
                        )}
                      </Td>
                      <Td>
                        <SmallInput
                          aria-label={`Limite de ${teacher.name}`}
                          type="number"
                          min={0}
                          placeholder="sem limite"
                          value={draft.limit}
                          onChange={(e) =>
                            updateDraft(teacher.id, { limit: e.target.value })
                          }
                        />
                      </Td>
                      <Td>
                        <ActionButton
                          disabled={busy}
                          onClick={() => handleSave(teacher)}
                          aria-label={`Salvar ${teacher.name}`}
                        >
                          Salvar
                        </ActionButton>
                        <ActionButton
                          disabled={busy}
                          onClick={() => handleResetPassword(teacher)}
                          aria-label={`Redefinir senha de ${teacher.name}`}
                        >
                          Redefinir senha
                        </ActionButton>
                        <DangerAction
                          disabled={busy}
                          onClick={() => setToUnlink(teacher)}
                          aria-label={`Desvincular ${teacher.name}`}
                        >
                          Desvincular
                        </DangerAction>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Section>

      <ConfirmModal
        open={toUnlink != null}
        title="Desvincular professor"
        message={`${toUnlink?.name ?? ''} deixa de ser professor desta escola. Aulas já aceitas continuam com ele.`}
        confirmText="Desvincular"
        onConfirm={confirmUnlink}
        onCancel={() => setToUnlink(null)}
      />
    </PageContainer>
  );
}
