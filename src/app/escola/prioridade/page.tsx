'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useNetworks } from '@/hooks/useNetworks';
import { usePriorityTiers } from '@/hooks/useEligibility';
import type { PriorityTier } from '@/services/eligibility.service';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  PageSubtitle,
  EmptyState,
  LoadingState,
} from '@/components/ui/AdminTable';
import { SkeletonRows } from '@/components/ui/Skeleton';

// Fase 5 (Design Doc Seção 9.3): níveis de prioridade configuráveis pela
// própria direção da escola. O primeiro nível (na ordem) para o qual o
// professor se qualifica decide quando a vaga aparece para ele — a escola
// pode restringir MAIS que a rede (redes interconectadas), nunca menos.
const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const Hint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 16px;
`;

const TierRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 2fr auto;
  gap: 12px;
  align-items: end;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
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
  width: 100%;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  width: 100%;
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

const Row = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const SCOPE_OPTIONS = [
  { value: 'ESCOLA', label: 'Professores da própria escola' },
  { value: 'REDE', label: 'Professores de qualquer escola da rede' },
  {
    value: 'REDE_INTERCONECTADA_INTERESSADA',
    label: 'Redes interconectadas (com interesse do professor ou contrato)',
  },
  { value: 'GERAL', label: 'Qualquer professor do sistema' },
];

export default function PrioridadePage() {
  const { activeSchoolId } = useSchoolContext();
  const { data, loading, save } = usePriorityTiers(activeSchoolId);
  const { networks } = useNetworks();
  const [tiers, setTiers] = useState<PriorityTier[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setTiers(data.tiers.map((tier) => ({ ...tier })));
    }
  }, [data]);

  const updateTier = (index: number, patch: Partial<PriorityTier>) => {
    setTiers((current) =>
      current.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    );
  };

  const addTier = () => {
    setTiers((current) => [
      ...current,
      { order: current.length + 1, delayMinutes: 0, scopeType: 'GERAL' },
    ]);
  };

  const removeTier = (index: number) => {
    setTiers((current) =>
      current
        .filter((_, i) => i !== index)
        .map((tier, i) => ({ ...tier, order: i + 1 })),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    setTiers((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy.map((tier, i) => ({ ...tier, order: i + 1 }));
    });
  };

  const onSave = async () => {
    if (tiers.some((tier) => tier.delayMinutes < 0)) {
      toast.error('Atraso não pode ser negativo');
      return;
    }
    setBusy(true);
    try {
      await save(tiers.map((tier, index) => ({ ...tier, order: index + 1 })));
    } catch {
      // erro do backend já exibido pelo interceptor
    } finally {
      setBusy(false);
    }
  };

  if (!activeSchoolId) {
    return (
      <PageContainer>
        <PageTitle>Prioridade de vagas</PageTitle>
        <EmptyState>Selecione uma escola para configurar a prioridade.</EmptyState>
      </PageContainer>
    );
  }

  const allowedNetworks = data?.allowedNetworkIds ?? [];
  const networkName = (id: number) =>
    networks.find((network) => network.id === id)?.name ?? `Rede #${id}`;

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Prioridade de vagas</PageTitle>
          <PageSubtitle>
            Quem vê a vaga primeiro, e depois de quanto tempo cada nível abre.
          </PageSubtitle>
        </div>
      </PageHeader>

      <Section>
        <Hint>
          O primeiro nível para o qual o professor se qualifica é o que decide quando a
          vaga aparece para ele. Redes interconectadas permitidas:{' '}
          {allowedNetworks.length > 0
            ? allowedNetworks.map(networkName).join(', ')
            : 'nenhuma (o MASTER configura em Redes de Ensino)'}
          . Sem níveis configurados, vale a janela simples de{' '}
          {data?.fallbackPriorityWindowHours ?? 0}h.
        </Hint>

        {loading ? (
          <LoadingState>
            <SkeletonRows />
          </LoadingState>
        ) : tiers.length === 0 ? (
          <EmptyState>Nenhum nível configurado — usando a janela simples.</EmptyState>
        ) : (
          tiers.map((tier, index) => (
            <TierRow key={`tier-${index}`}>
              <FormGroup>
                <Label>Ordem</Label>
                <Input value={index + 1} readOnly disabled />
              </FormGroup>
              <FormGroup>
                <Label>Espera (minutos)</Label>
                <Input
                  type="number"
                  min={0}
                  value={tier.delayMinutes}
                  onChange={(e) =>
                    updateTier(index, { delayMinutes: Number(e.target.value) })
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>Nível</Label>
                <Select
                  value={tier.scopeType}
                  onChange={(e) => updateTier(index, { scopeType: e.target.value })}
                >
                  {SCOPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <div>
                <SecondaryButton
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Subir nível"
                >
                  ↑
                </SecondaryButton>{' '}
                <SecondaryButton
                  disabled={index === tiers.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Descer nível"
                >
                  ↓
                </SecondaryButton>{' '}
                <DangerButton onClick={() => removeTier(index)} aria-label="Remover nível">
                  ×
                </DangerButton>
              </div>
            </TierRow>
          ))
        )}

        <Row>
          <SecondaryButton onClick={addTier}>Adicionar nível</SecondaryButton>
          <Button onClick={onSave} disabled={busy}>
            {busy ? 'Salvando...' : 'Salvar níveis'}
          </Button>
        </Row>
      </Section>
    </PageContainer>
  );
}
