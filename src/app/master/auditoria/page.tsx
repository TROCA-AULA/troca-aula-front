'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNetworks } from '@/hooks/useNetworks';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { SkeletonRows } from '@/components/ui/Skeleton';
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
import type { AuditLogEntry } from '@/types/master';

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  min-width: 260px;
`;

const DetailsToggle = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.info};
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  text-decoration: underline;
`;

const DiffPre = styled.pre`
  font-size: 12px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  overflow-x: auto;
  max-width: 480px;
  white-space: pre-wrap;
  word-break: break-word;
`;

function EntryDetails({ entry }: { entry: AuditLogEntry }) {
  const [open, setOpen] = useState(false);
  if (!entry.before && !entry.after && !entry.justification) return <span>-</span>;
  return (
    <>
      <DetailsToggle onClick={() => setOpen((v) => !v)}>
        {open ? 'ocultar' : 'ver detalhes'}
      </DetailsToggle>
      {open && (
        <DiffPre>
          {entry.justification ? `Justificativa: ${entry.justification}\n\n` : ''}
          {JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}
        </DiffPre>
      )}
    </>
  );
}

export default function AuditoriaPage() {
  const { networks, loading: networksLoading } = useNetworks();
  const { activeNetworkId } = useSchoolContext();
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | undefined>(undefined);
  const { entries, loading } = useAuditLog(selectedNetworkId);

  // Já abre na rede da escola ativa do usuário (claim `networkId` do JWT →
  // SchoolContext), quando ela estiver na lista de redes; o seletor
  // continua livre para consultar outras redes.
  useEffect(() => {
    if (
      selectedNetworkId === undefined &&
      activeNetworkId != null &&
      networks.some((n) => n.id === activeNetworkId)
    ) {
      setSelectedNetworkId(activeNetworkId);
    }
  }, [activeNetworkId, networks, selectedNetworkId]);

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Auditoria</PageTitle>
          <PageSubtitle>
            Rastreabilidade de alterações (Design Doc Seção 5.3) — hoje registra mudanças em
            Jornada Docente. Selecione uma rede para ver o histórico.
          </PageSubtitle>
        </div>
      </PageHeader>

      <FilterBar>
        <FilterLabel htmlFor="networkFilter">Rede:</FilterLabel>
        <Select
          id="networkFilter"
          disabled={networksLoading}
          value={selectedNetworkId ?? ''}
          onChange={(e) => setSelectedNetworkId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Selecione uma rede...</option>
          {networks.map((network) => (
            <option key={network.id} value={network.id}>
              {network.name}
            </option>
          ))}
        </Select>
      </FilterBar>

      {!selectedNetworkId ? (
        <EmptyState>Selecione uma rede para ver o histórico de alterações.</EmptyState>
      ) : loading ? (
        <LoadingState><SkeletonRows /></LoadingState>
      ) : entries.length === 0 ? (
        <EmptyState>Nenhuma alteração registrada para esta rede ainda.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Data/Hora</Th>
              <Th>Entidade</Th>
              <Th>Alterado por</Th>
              <Th>Detalhes</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <Td>{new Date(entry.changedAt).toLocaleString('pt-BR')}</Td>
                <Td>
                  {entry.entityType} #{entry.entityId}
                </Td>
                <Td>{entry.changedByName ?? `Usuário #${entry.changedById}`}</Td>
                <Td>
                  <EntryDetails entry={entry} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageContainer>
  );
}
