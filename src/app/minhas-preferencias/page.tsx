'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useNetworks } from '@/hooks/useNetworks';
import { useProfessorPreferences } from '@/hooks/useEligibility';
import { schoolsService } from '@/services/schools.service';
import type { School } from '@/types/master';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  PageSubtitle,
  Table,
  Th,
  Td,
  EmptyState,
  LoadingState,
} from '@/components/ui/AdminTable';
import { SkeletonRows } from '@/components/ui/Skeleton';

// Fase 5 — o professor escolhe em quais redes quer ver vagas (interesse) e
// quais escolas quer vetar (exclusão). A exclusão vence qualquer critério e
// só afeta vagas novas (histórico não muda) — ver Design Doc Seção 9.3.
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
  margin-bottom: 16px;
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

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  min-width: 260px;
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

const LinkButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
`;

export default function MinhasPreferenciasPage() {
  const router = useRouter();
  const { user, isLoading } = useSchoolContext();
  const { networks } = useNetworks();
  const {
    preferences,
    loading,
    addNetworkInterest,
    removeNetworkInterest,
    addSchoolExclusion,
    removeSchoolExclusion,
  } = useProfessorPreferences();

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    schoolsService
      .getSchools()
      .then((data) => setSchools(data ?? []))
      .catch(() => setSchools([]));
  }, []);

  if (isLoading || !user) {
    return (
      <PageContainer>
        <LoadingState>
          <SkeletonRows />
        </LoadingState>
      </PageContainer>
    );
  }

  const excludedIds = new Set(preferences.schoolExclusions.map((e) => e.schoolId));
  const interestedIds = new Set(preferences.networkInterests.map((i) => i.networkId));

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch {
      // O interceptor do api-client já mostra a mensagem do backend.
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Minhas preferências de vagas</PageTitle>
          <PageSubtitle>
            Interesses e exclusões usados na prioridade de exibição das aulas vagas.
          </PageSubtitle>
        </div>
      </PageHeader>

      <Section>
        <SectionTitle>Redes de interesse</SectionTitle>
        <Hint>
          Marque municípios/redes (além do seu contrato) em que você aceita ver vagas
          interconectadas. Interesse é um critério positivo de prioridade.
        </Hint>
        <Row>
          <FormGroup>
            <Label htmlFor="networkSelect">Rede</Label>
            <Select
              id="networkSelect"
              value={selectedNetworkId ?? ''}
              onChange={(e) =>
                setSelectedNetworkId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Selecione...</option>
              {networks
                .filter((network) => !interestedIds.has(network.id))
                .map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
            </Select>
          </FormGroup>
          <Button
            disabled={!selectedNetworkId || busy}
            onClick={() =>
              run(async () => {
                await addNetworkInterest(selectedNetworkId as number);
                setSelectedNetworkId(null);
              })
            }
          >
            Adicionar interesse
          </Button>
        </Row>

        {loading ? (
          <LoadingState>
            <SkeletonRows rows={2} />
          </LoadingState>
        ) : preferences.networkInterests.length === 0 ? (
          <EmptyState>Nenhuma rede de interesse cadastrada.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Rede</Th>
                <Th>Ação</Th>
              </tr>
            </thead>
            <tbody>
              {preferences.networkInterests.map((interest) => (
                <tr key={interest.networkId}>
                  <Td>{interest.networkName ?? `Rede #${interest.networkId}`}</Td>
                  <Td>
                    <LinkButton
                      disabled={busy}
                      onClick={() =>
                        run(() => removeNetworkInterest(interest.networkId))
                      }
                    >
                      remover
                    </LinkButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section>
        <SectionTitle>Escolas excluídas</SectionTitle>
        <Hint>
          Você deixa de ver (e de conseguir se candidatar a) vagas novas destas escolas,
          mesmo que tenha vínculo ou interesse na rede dela. Não afeta seu histórico.
        </Hint>
        <Row>
          <FormGroup>
            <Label htmlFor="schoolSelect">Escola</Label>
            <Select
              id="schoolSelect"
              value={selectedSchoolId ?? ''}
              onChange={(e) =>
                setSelectedSchoolId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Selecione...</option>
              {schools
                .filter((school) => !excludedIds.has(school.id))
                .map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
            </Select>
          </FormGroup>
          <Button
            disabled={!selectedSchoolId || busy}
            onClick={() =>
              run(async () => {
                await addSchoolExclusion(selectedSchoolId as number);
                setSelectedSchoolId(null);
              })
            }
          >
            Excluir escola
          </Button>
        </Row>

        {loading ? (
          <LoadingState>
            <SkeletonRows rows={2} />
          </LoadingState>
        ) : preferences.schoolExclusions.length === 0 ? (
          <EmptyState>Nenhuma escola excluída.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Escola</Th>
                <Th>Ação</Th>
              </tr>
            </thead>
            <tbody>
              {preferences.schoolExclusions.map((exclusion) => (
                <tr key={exclusion.schoolId}>
                  <Td>{exclusion.schoolName ?? `Escola #${exclusion.schoolId}`}</Td>
                  <Td>
                    <LinkButton
                      disabled={busy}
                      onClick={() =>
                        run(() => removeSchoolExclusion(exclusion.schoolId))
                      }
                    >
                      remover
                    </LinkButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </PageContainer>
  );
}
