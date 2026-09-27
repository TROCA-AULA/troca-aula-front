'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useNetworks } from '@/hooks/useNetworks';
import { NetworkForm } from './components/NetworkForm';
import type { Network } from '@/types/master';

const PageContainer = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

export default function RedesPage() {
  const { networks, loading } = useNetworks();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

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
        <LoadingState>Carregando...</LoadingState>
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
    </PageContainer>
  );
}
