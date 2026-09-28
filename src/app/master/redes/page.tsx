'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useNetworks } from '@/hooks/useNetworks';
import { NetworkForm } from './components/NetworkForm';
import { NetworkInterconnectionsModal } from './components/NetworkInterconnectionsModal';
import type { Network } from '@/types/master';
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

// P13: container/header/tabela/estados agora vêm do AdminTable + theme;
// só o que é específico desta tela (botões de ação) segue local.
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

export default function RedesPage() {
  const { networks, loading } = useNetworks();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [interconnectionsFor, setInterconnectionsFor] = useState<Network | null>(null);

  const handleCreate = () => {
    setFormMode('create');
    setSelectedNetwork(null);
    setFormOpen(true);
  };

  const handleEdit = (network: Network) => {
    setFormMode('edit');
    setSelectedNetwork(network);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>
          <SkeletonRows />
        </LoadingState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Gerenciar Redes de Ensino</PageTitle>
          <PageSubtitle>
            Rede de Ensino é o tenant real da plataforma (ex: Secretaria Municipal de
            Educação de um município) — cada escola pertence a uma rede.
          </PageSubtitle>
        </div>
        <AddButton onClick={handleCreate}>+ Nova Rede</AddButton>
      </PageHeader>

      {networks.length === 0 ? (
        <EmptyState>
          <p>Nenhuma rede cadastrada.</p>
          <p>Clique em &quot;+ Nova Rede&quot; para adicionar.</p>
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Nome</Th>
              <Th>Criado em</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {networks.map((network) => (
              <tr key={network.id}>
                <Td>{network.id}</Td>
                <Td>{network.name}</Td>
                <Td>{new Date(network.createdAt).toLocaleDateString('pt-BR')}</Td>
                <Td>
                  <ActionButton onClick={() => handleEdit(network)}>Editar</ActionButton>
                  <ActionButton onClick={() => setInterconnectionsFor(network)}>
                    Interconexões
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <NetworkForm
        open={formOpen}
        mode={formMode}
        initialData={selectedNetwork}
        onClose={() => setFormOpen(false)}
      />

      <NetworkInterconnectionsModal
        open={interconnectionsFor !== null}
        network={interconnectionsFor}
        networks={networks}
        onClose={() => setInterconnectionsFor(null)}
      />
    </PageContainer>
  );
}
