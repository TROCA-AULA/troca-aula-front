'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useWorkloadPolicies } from '@/hooks/useWorkloadPolicies';
import { useNetworks } from '@/hooks/useNetworks';
import { WorkloadPolicyForm } from './components/WorkloadPolicyForm';
import { WORKLOAD_TYPES } from '@/types/master';
import type { WorkloadPolicy } from '@/types/master';

const PageContainer = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const PageSubtitle = styled.p`
  font-size: 13px;
  color: #666;
  margin: 4px 0 0 0;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  color: #333;
  font-weight: 500;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 260px;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background-color: #1e3a5f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2a4a73;
  }

  &:focus {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  text-align: left;
  padding: 16px;
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  font-size: 14px;
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #eee;
  color: #666;
  font-size: 14px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  background-color: #e3f2fd;
  color: #1976d2;

  &:hover {
    background-color: #bbdefb;
  }

  &:focus {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: #666;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 48px;
  color: #666;
`;

const workloadTypeName = (id: number) =>
  WORKLOAD_TYPES.find((t) => t.id === id)?.name ?? `Tipo #${id}`;

export default function PoliticasCargaHorariaPage() {
  const { networks, loading: networksLoading } = useNetworks();
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | undefined>(undefined);
  const { policies, loading } = useWorkloadPolicies(selectedNetworkId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedPolicy, setSelectedPolicy] = useState<WorkloadPolicy | null>(null);

  const handleCreate = () => {
    setFormMode('create');
    setSelectedPolicy(null);
    setFormOpen(true);
  };

  const handleEdit = (policy: WorkloadPolicy) => {
    setFormMode('edit');
    setSelectedPolicy(policy);
    setFormOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Políticas de Carga Horária</PageTitle>
          <PageSubtitle>
            Regra municipal (por rede) — não confundir com a janela de prioridade, que é
            configurada por cada escola individualmente.
          </PageSubtitle>
        </div>
        <AddButton onClick={handleCreate}>+ Nova Política</AddButton>
      </PageHeader>

      <FilterBar>
        <FilterLabel htmlFor="networkFilter">Rede:</FilterLabel>
        <Select
          id="networkFilter"
          disabled={networksLoading}
          value={selectedNetworkId ?? ''}
          onChange={(e) => setSelectedNetworkId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Todas as redes</option>
          {networks.map((network) => (
            <option key={network.id} value={network.id}>
              {network.name}
            </option>
          ))}
        </Select>
      </FilterBar>

      {loading ? (
        <LoadingState>Carregando...</LoadingState>
      ) : policies.length === 0 ? (
        <EmptyState>
          <p>Nenhuma política cadastrada{selectedNetworkId ? ' para esta rede' : ''}.</p>
          <p>Clique em &quot;+ Nova Política&quot; para adicionar.</p>
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Rede</Th>
              <Th>Tipo de Carga</Th>
              <Th>Limite (h/semana)</Th>
              <Th>Exige Ata Oficial</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id}>
                <Td>{policy.id}</Td>
                <Td>{networks.find((n) => n.id === policy.networkId)?.name ?? `Rede #${policy.networkId}`}</Td>
                <Td>{workloadTypeName(policy.workloadTypeId)}</Td>
                <Td>{policy.maxHoursPerWeek ?? 'Sem limite'}</Td>
                <Td>{policy.ataOficialRequired ? 'Sim' : 'Não'}</Td>
                <Td>
                  <ActionButton onClick={() => handleEdit(policy)}>Editar</ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <WorkloadPolicyForm
        open={formOpen}
        mode={formMode}
        initialData={selectedPolicy}
        defaultNetworkId={selectedNetworkId}
        onClose={() => setFormOpen(false)}
      />
    </PageContainer>
  );
}
