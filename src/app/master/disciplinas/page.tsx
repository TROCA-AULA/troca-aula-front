'use client';

import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { masterService } from '@/services/master.service';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { Subject } from '@/types/teacher';
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

// Catálogo GLOBAL de disciplinas: vale para todas as redes e escolas. Só o
// MASTER cria, renomeia ou remove. A disciplina do professor decide quais
// aulas vagas ele vê.

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

const Form = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 240px;
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
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const DangerAction = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.onPrimary};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

export default function DisciplinasPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [toRemove, setToRemove] = useState<Subject | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSubjects(await masterService.getSubjects());
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isDuplicate = (name: string, ignoreId?: number) =>
    subjects.some(
      (subject) =>
        subject.id !== ignoreId &&
        subject.name.trim().toLocaleLowerCase('pt-BR') === name.trim().toLocaleLowerCase('pt-BR'),
    );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (isDuplicate(name)) {
      toast.error(`Já existe a disciplina "${name}".`);
      return;
    }
    setBusy(true);
    try {
      await masterService.createSubject(name);
      toast.success(`Disciplina "${name}" criada`);
      setNewName('');
      await load();
    } catch {
      // mensagem do backend já aparece no toast do api-client
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return;
    if (isDuplicate(name, editing.id)) {
      toast.error(`Já existe a disciplina "${name}".`);
      return;
    }
    try {
      await masterService.renameSubject(editing.id, name);
      toast.success('Disciplina renomeada');
      setEditing(null);
      await load();
    } catch {
      // toast do api-client
    }
  };

  const confirmRemove = async () => {
    const subject = toRemove;
    setToRemove(null);
    if (!subject) return;
    try {
      await masterService.deleteSubject(subject.id);
      toast.success(`Disciplina "${subject.name}" removida`);
      await load();
    } catch {
      // toast do api-client
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Disciplinas</PageTitle>
          <PageSubtitle>
            Catálogo único para todas as redes. O professor só vê aulas vagas da sua disciplina.
          </PageSubtitle>
        </div>
      </PageHeader>

      <Section>
        <SectionTitle>Nova disciplina</SectionTitle>
        <Form onSubmit={handleCreate}>
          <FormGroup>
            <Label htmlFor="subject-name">Nome da disciplina</Label>
            <Input
              id="subject-name"
              value={newName}
              maxLength={100}
              onChange={(e) => setNewName(e.target.value)}
            />
          </FormGroup>
          <PrimaryButton type="submit" disabled={busy || newName.trim() === ''}>
            {busy ? 'Salvando...' : 'Criar disciplina'}
          </PrimaryButton>
        </Form>
      </Section>

      <Section>
        <SectionTitle>Disciplinas cadastradas</SectionTitle>
        {loading ? (
          <LoadingState>
            <SkeletonRows />
          </LoadingState>
        ) : subjects.length === 0 ? (
          <EmptyState>Nenhuma disciplina cadastrada.</EmptyState>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <Td>
                      {editing?.id === subject.id ? (
                        <Input
                          aria-label={`Novo nome de ${subject.name}`}
                          value={editing.name}
                          maxLength={100}
                          autoFocus
                          onChange={(e) => setEditing({ id: subject.id, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') setEditing(null);
                          }}
                        />
                      ) : (
                        subject.name
                      )}
                    </Td>
                    <Td>
                      {editing?.id === subject.id ? (
                        <Actions>
                          <ActionButton
                            onClick={handleRename}
                            disabled={editing.name.trim() === ''}
                          >
                            Salvar
                          </ActionButton>
                          <ActionButton onClick={() => setEditing(null)}>Cancelar</ActionButton>
                        </Actions>
                      ) : (
                        <Actions>
                          <ActionButton
                            onClick={() => setEditing({ id: subject.id, name: subject.name })}
                            aria-label={`Renomear ${subject.name}`}
                          >
                            Renomear
                          </ActionButton>
                          <DangerAction
                            onClick={() => setToRemove(subject)}
                            aria-label={`Remover ${subject.name}`}
                          >
                            Remover
                          </DangerAction>
                        </Actions>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Section>

      <ConfirmModal
        open={toRemove != null}
        title="Remover disciplina"
        message={`"${toRemove?.name ?? ''}" deixa de aparecer no cadastro e nas listas. Professores que já têm essa disciplina continuam com ela até o gestor trocar; aulas já criadas não mudam.`}
        confirmText="Remover"
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </PageContainer>
  );
}
