'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
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
import { formatDelay } from '@/utils/delay';

// Grupos de prioridade (regra definida com o stakeholder):
//  - a escola cria grupos com PRIORIDADE (0 = primeiro) e TEMPO DE ESPERA;
//  - o professor do grupo de prioridade N vê a vaga a partir do tempo do
//    grupo dele (prioridade 0 recebe primeiro);
//  - escola SEM grupos: todo mundo vê a vaga na hora;
//  - escola COM grupos: quem não está em grupo é o último a receber.
// O município define para quais redes exibe as vagas e a escola pode
// restringir mais.
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
  color: ${({ theme }) => theme.colors.onPrimary};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.disabled};
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

const Timeline = styled.ol`
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  li {
    margin-bottom: 6px;
  }
`;

const Badge = styled.span`
  display: inline-block;
  min-width: 28px;
  padding: 2px 8px;
  margin-right: 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-size: 12px;
  font-weight: 600;
  text-align: center;
`;

const SmallInput = styled(Input)`
  width: 96px;
`;

const DangerButton = styled(SecondaryButton)`
  color: ${({ theme }) => theme.colors.danger};
  border-color: ${({ theme }) => theme.colors.danger};
`;

interface GroupDraft {
  name: string;
  priority: number;
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

  const [drafts, setDrafts] = useState<Record<number, GroupDraft>>({});
  const [newName, setNewName] = useState('');
  const [newPriority, setNewPriority] = useState('');
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
        priority: group.priority ?? 0,
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

  const updateDraft = (groupId: number, patch: Partial<GroupDraft>) =>
    setDrafts((current) => {
      const draft = current[groupId];
      if (!draft) return current;
      return { ...current, [groupId]: { ...draft, ...patch } };
    });

  const toggleMember = (groupId: number, professorId: number) => {
    const draft = drafts[groupId];
    if (!draft) return;
    const members = new Set(draft.members);
    if (members.has(professorId)) members.delete(professorId);
    else members.add(professorId);
    updateDraft(groupId, { members });
  };

  const toggleAcceptedNetwork = (networkId: number) => {
    setAccepted((current) => {
      const next = new Set(current);
      if (next.has(networkId)) next.delete(networkId);
      else next.add(networkId);
      return next;
    });
  };

  if (!activeSchoolId) {
    return (
      <PageContainer>
        <PageTitle>Prioridade de vagas</PageTitle>
        <EmptyState>Selecione uma escola para configurar a prioridade.</EmptyState>
      </PageContainer>
    );
  }

  const groups = [...(data?.groups ?? [])].sort(
    (a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.delayMinutes - b.delayMinutes,
  );
  const hasGroups = groups.length > 0;
  const allowedNetworkIds = data?.allowedNetworkIds ?? [];
  const networkName = (id: number) =>
    data?.allowedNetworks?.find((network) => network.id === id)?.name ?? `Rede #${id}`;

  // Em quais grupos cada professor está (para avisar quando está em mais de
  // um — vale o de MENOR prioridade).
  const groupsOf = (professorId: number) =>
    groups.filter((group) => group.professorIds.includes(professorId));

  const ungroupedTeachers = hasGroups
    ? linkedTeachers.filter((teacher) => groupsOf(teacher.id).length === 0)
    : [];

  const ungroupedWhen =
    data?.ungroupedEffectiveDelayMinutes ??
    (hasGroups
      ? Math.max(ungroupedDelay, ...groups.map((group) => group.delayMinutes))
      : 0);

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Prioridade de vagas</PageTitle>
          <PageSubtitle>
            Quem recebe primeiro as vagas desta escola.
          </PageSubtitle>
        </div>
      </PageHeader>

      <Section>
        <SectionTitle>Como funciona</SectionTitle>
        <Hint>
          Cada grupo tem uma prioridade (0 recebe primeiro) e um tempo de espera,
          contado a partir da publicação da vaga. Sem grupos, todos os professores
          veem a vaga na hora. Com grupos, quem não está em nenhum grupo é o último a
          receber. Se um professor estiver em mais de um grupo, vale o de menor
          prioridade.
        </Hint>
        {loading ? null : hasGroups ? (
          <Timeline aria-label="Ordem de recebimento">
            {groups.map((group) => (
              <li key={group.id}>
                <Badge>{group.priority ?? 0}</Badge>
                <strong>{group.name}</strong> — vê {formatDelay(group.delayMinutes)}
                {group.delayMinutes > 0 ? ' depois de publicada' : ''} (
                {group.professorIds.length} professor(es))
              </li>
            ))}
            <li>
              <Badge>—</Badge>
              <strong>Sem grupo</strong> — vê {formatDelay(ungroupedWhen)}
              {ungroupedWhen > 0 ? ' depois de publicada' : ''} (
              {ungroupedTeachers.length} professor(es) desta escola)
            </li>
          </Timeline>
        ) : (
          <Hint style={{ margin: 0 }}>
            <strong>Esta escola não tem grupos:</strong> todos os professores veem
            as vagas na hora.
          </Hint>
        )}
      </Section>

      <Section>
        <SectionTitle>Grupos de prioridade</SectionTitle>
        <Hint>
          Um grupo de prioridade menor não pode esperar mais que um de prioridade
          maior (ex.: prioridade 0 com 60 min e prioridade 1 com 30 min é recusado).
        </Hint>

        {loading ? (
          <LoadingState>
            <SkeletonRows />
          </LoadingState>
        ) : !hasGroups ? (
          <EmptyState>Nenhum grupo criado — todos veem as vagas na hora.</EmptyState>
        ) : (
          groups.map((group) => {
            const draft = drafts[group.id];
            if (!draft) return null;
            return (
              <GroupCard key={group.id}>
                <GroupHeader>
                  <FormGroup>
                    <Label htmlFor={`priority-${group.id}`}>Prioridade</Label>
                    <SmallInput
                      id={`priority-${group.id}`}
                      type="number"
                      min={0}
                      value={draft.priority}
                      onChange={(e) =>
                        updateDraft(group.id, { priority: Number(e.target.value) })
                      }
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor={`name-${group.id}`}>Nome</Label>
                    <Input
                      id={`name-${group.id}`}
                      value={draft.name}
                      onChange={(e) => updateDraft(group.id, { name: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor={`delay-${group.id}`}>Espera (minutos)</Label>
                    <SmallInput
                      id={`delay-${group.id}`}
                      type="number"
                      min={0}
                      value={draft.delayMinutes}
                      onChange={(e) =>
                        updateDraft(group.id, { delayMinutes: Number(e.target.value) })
                      }
                    />
                  </FormGroup>
                  <SecondaryButton
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        updateGroup(group.id, {
                          name: draft.name,
                          priority: draft.priority,
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
                    linkedTeachers.map((teacher) => {
                      const others = groupsOf(teacher.id).filter(
                        (other) => other.id !== group.id,
                      );
                      return (
                        <MemberOption key={teacher.id}>
                          <input
                            type="checkbox"
                            checked={draft.members.has(teacher.id)}
                            onChange={() => toggleMember(group.id, teacher.id)}
                          />
                          {teacher.name}
                          {others.length > 0 && (
                            <small>
                              {' '}
                              (também em {others.map((other) => other.name).join(', ')})
                            </small>
                          )}
                        </MemberOption>
                      );
                    })
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
            <Label htmlFor="new-group-priority">Prioridade</Label>
            <SmallInput
              id="new-group-priority"
              type="number"
              min={0}
              placeholder="próxima"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="new-group-delay">Espera (minutos)</Label>
            <SmallInput
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
                await createGroup(
                  newName.trim(),
                  newDelay,
                  newPriority.trim() === '' ? undefined : Number(newPriority),
                );
                setNewName('');
                setNewPriority('');
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
              Espera mínima de quem não está em grupo (minutos)
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
        <Hint>
          Só vale quando a escola tem grupos: quem está sem grupo recebe depois do
          último grupo, ou depois desta espera, se ela for maior.
        </Hint>

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
