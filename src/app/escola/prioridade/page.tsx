'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useNetworks } from '@/hooks/useNetworks';
import { useTeacherGroups } from '@/hooks/useEligibility';
import { useTeachers } from '@/hooks/useTeachers';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  PageSubtitle,
  EmptyState,
  LoadingState,
} from '@/components/ui/AdminTable';
import { SkeletonRows } from '@/components/ui/Skeleton';

// Fase 5 (modelo definido com o stakeholder): a escola cria grupos de
// professores com nome + tempo de espera. Quem está no grupo vê a vaga
// após o delay do grupo; fora de grupo, após o delay padrão. O município
// define para quais redes exibe as vagas e a escola pode restringir mais.
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
  margin: 0 0 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const GroupCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 14px;
  margin-bottom: 12px;
`;

const GroupHeader = styled.div`
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
`;

const MembersList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  margin-top: 10px;
`;

const MemberOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
`;

const Button = styled.button`
  padding: 9px 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const DangerButton = styled(SecondaryButton)`
  color: ${({ theme }) => theme.colors.danger};
  border-color: ${({ theme }) => theme.colors.danger};
`;

interface GroupDraft {
  name: string;
  delayMinutes: number;
  members: Set<number>;
}

export default function PrioridadePage() {
  const { activeSchoolId } = useSchoolContext();
  const {
    data,
    loading,
    createGroup,
    updateGroup,
    removeGroup,
    setGroupMembers,
    updateSettings,
  } = useTeacherGroups(activeSchoolId);
  const { linkedTeachers, fetchLinkedTeachers } = useTeachers(activeSchoolId ?? 0);
  const { networks } = useNetworks();

  const [drafts, setDrafts] = useState<Record<number, GroupDraft>>({});
  const [newName, setNewName] = useState('');
  const [newDelay, setNewDelay] = useState(0);
  const [ungroupedDelay, setUngroupedDelay] = useState(0);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (activeSchoolId) fetchLinkedTeachers();
  }, [activeSchoolId]);

  useEffect(() => {
    if (!data) return;
    const next: Record<number, GroupDraft> = {};
    for (const group of data.groups) {
      next[group.id] = {
        name: group.name,
        delayMinutes: group.delayMinutes,
        members: new Set(group.professorIds),
      };
    }
    setDrafts(next);
    setUngroupedDelay(data.ungroupedDelayMinutes);
    setAccepted(new Set(data.acceptedNetworkIds ?? []));
  }, [data]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } catch {
      // erro exibido pelo interceptor do api-client
    } finally {
      setBusy(false);
    }
  };

  const toggleMember = (groupId: number, professorId: number) => {
    setDrafts((current) => {
      const draft = current[groupId];
      if (!draft) return current;
      const members = new Set(draft.members);
      if (members.has(professorId)) members.delete(professorId);
      else members.add(professorId);
      return { ...current, [groupId]: { ...draft, members } };
    });
  };

  const toggleAcceptedNetwork = (networkId: number) => {
    setAccepted((current) => {
      const next = new Set(current);
      if (next.has(networkId)) next.delete(networkId);
      else next.add(networkId);
      return next;
    });
  };

  const networkName = (id: number) =>
    networks.find((network) => network.id === id)?.name ?? `Rede #${id}`;

  if (!activeSchoolId) {
    return (
      <PageContainer>
        <PageTitle>Prioridade de vagas</PageTitle>
        <EmptyState>Selecione uma escola para configurar a prioridade.</EmptyState>
      </PageContainer>
    );
  }

  const allowedNetworkIds = data?.allowedNetworkIds ?? [];

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Prioridade de vagas</PageTitle>
          <PageSubtitle>
            Grupos de professores da escola e o tempo de espera de cada um.
          </PageSubtitle>
        </div>
      </PageHeader>

      <Section>
        <SectionTitle>Grupos de prioridade</SectionTitle>
        <Hint>
          Quem está em um grupo vê a vaga depois do delay do grupo; quem não está em
          nenhum grupo vê depois de {ungroupedDelay} minuto(s). Ex.: um grupo
          &quot;Professores da casa&quot; com 0 minuto vê na hora; &quot;Menor
          prioridade&quot; com 120 vê após 2h.
        </Hint>

        {loading ? (
          <LoadingState>
            <SkeletonRows />
          </LoadingState>
        ) : (data?.groups.length ?? 0) === 0 ? (
          <EmptyState>
            Nenhum grupo criado — a escola está no modo de janela única
            {data?.fallbackPriorityWindowHours != null
              ? ` (${data.fallbackPriorityWindowHours}h)`
              : ''}
            .
          </EmptyState>
        ) : (
          data?.groups.map((group) => {
            const draft = drafts[group.id];
            if (!draft) return null;
            return (
              <GroupCard key={group.id}>
                <GroupHeader>
                  <FormGroup>
                    <Label htmlFor={`name-${group.id}`}>Nome</Label>
                    <Input
                      id={`name-${group.id}`}
                      value={draft.name}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [group.id]: { ...draft, name: e.target.value },
                        }))
                      }
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor={`delay-${group.id}`}>Espera (minutos)</Label>
                    <Input
                      id={`delay-${group.id}`}
                      type="number"
                      min={0}
                      value={draft.delayMinutes}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [group.id]: {
                            ...draft,
                            delayMinutes: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </FormGroup>
                  <SecondaryButton
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        updateGroup(group.id, {
                          name: draft.name,
                          delayMinutes: draft.delayMinutes,
                        }),
                      )
                    }
                  >
                    Salvar grupo
                  </SecondaryButton>
                  <DangerButton
                    disabled={busy}
                    onClick={() => run(() => removeGroup(group.id))}
                    aria-label={`Remover grupo ${group.name}`}
                  >
                    Remover
                  </DangerButton>
                </GroupHeader>

                <MembersList>
                  {linkedTeachers.length === 0 ? (
                    <Hint>Nenhum professor vinculado à escola ainda.</Hint>
                  ) : (
                    linkedTeachers.map((teacher) => (
                      <MemberOption key={teacher.id}>
                        <input
                          type="checkbox"
                          checked={draft.members.has(teacher.id)}
                          onChange={() => toggleMember(group.id, teacher.id)}
                        />
                        {teacher.name}
                      </MemberOption>
                    ))
                  )}
                </MembersList>
                <Row style={{ marginTop: 10, marginBottom: 0 }}>
                  <SecondaryButton
                    disabled={busy}
                    onClick={() =>
                      run(() => setGroupMembers(group.id, [...draft.members]))
                    }
                  >
                    Salvar professores do grupo
                  </SecondaryButton>
                </Row>
              </GroupCard>
            );
          })
        )}

        <Row>
          <FormGroup>
            <Label htmlFor="new-group-name">Novo grupo</Label>
            <Input
              id="new-group-name"
              placeholder="Ex.: Professores da casa"
              value={newName}
              maxLength={80}
              onChange={(e) => setNewName(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="new-group-delay">Espera (minutos)</Label>
            <Input
              id="new-group-delay"
              type="number"
              min={0}
              value={newDelay}
              onChange={(e) => setNewDelay(Number(e.target.value))}
            />
          </FormGroup>
          <Button
            disabled={busy || newName.trim().length === 0}
            onClick={() =>
              run(async () => {
                await createGroup(newName.trim(), newDelay);
                setNewName('');
                setNewDelay(0);
              })
            }
          >
            Criar grupo
          </Button>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Configurações da escola</SectionTitle>
        <Hint>
          O município decide para quais redes exibe suas vagas
          {allowedNetworkIds.length > 0
            ? ` (permitidas: ${allowedNetworkIds.map(networkName).join(', ')})`
            : ' (nenhuma interconexão configurada pelo município)'}
          . A escola pode restringir mais, nunca menos.
        </Hint>

        <Row>
          <FormGroup>
            <Label htmlFor="ungrouped-delay">
              Espera de quem não está em grupo (minutos)
            </Label>
            <Input
              id="ungrouped-delay"
              type="number"
              min={0}
              value={ungroupedDelay}
              onChange={(e) => setUngroupedDelay(Number(e.target.value))}
            />
          </FormGroup>
        </Row>

        {allowedNetworkIds.length > 0 && (
          <MembersList>
            {allowedNetworkIds.map((networkId) => (
              <MemberOption key={networkId}>
                <input
                  type="checkbox"
                  checked={accepted.has(networkId)}
                  onChange={() => toggleAcceptedNetwork(networkId)}
                />
                Aceitar professores de {networkName(networkId)}
              </MemberOption>
            ))}
          </MembersList>
        )}

        <Row style={{ marginTop: 12, marginBottom: 0 }}>
          <Button
            disabled={busy}
            onClick={() =>
              run(() =>
                updateSettings({
                  ungroupedDelayMinutes: ungroupedDelay,
                  acceptedNetworkIds:
                    accepted.size > 0 ? [...accepted] : null,
                }),
              )
            }
          >
            Salvar configurações
          </Button>
        </Row>
      </Section>
    </PageContainer>
  );
}
