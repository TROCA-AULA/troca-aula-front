'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useSchools } from '@/hooks/useSchools';
import { useNetworks } from '@/hooks/useNetworks';
import { SchoolForm } from './components/SchoolForm';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { School } from '@/types/master';

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

  &:focus {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
  }
`;

const EditButton = styled(ActionButton)`
  background-color: #e3f2fd;
  color: #1976d2;

  &:hover {
    background-color: #bbdefb;
  }
`;

const DeleteButton = styled(ActionButton)`
  background-color: #ffebee;
  color: #c62828;

  &:hover {
    background-color: #ffcdd2;
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

export default function EscolasPage() {
  const { schools, loading, deleteSchool } = useSchools();
  const { networks } = useNetworks();
  const networkName = (networkId: number) =>
    networks.find((n) => n.id === networkId)?.name ?? `Rede #${networkId}`;
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<School | null>(null);

  const handleCreate = () => {
    setFormMode('create');
    setSelectedSchool(null);
    setFormOpen(true);
  };

  const handleEdit = (school: School) => {
    setFormMode('edit');
    setSelectedSchool(school);
    setFormOpen(true);
  };

  const handleDelete = (school: School) => {
    setDeleteConfirm(school);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteSchool(deleteConfirm.id);
      setDeleteConfirm(null);
    }
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
        <PageTitle>Gerenciar Escolas</PageTitle>
        <AddButton onClick={handleCreate}>+ Nova Escola</AddButton>
      </PageHeader>

      {schools.length === 0 ? (
        <EmptyState>
          <p>Nenhuma escola cadastrada.</p>
          <p>Clique em &quot;+ Nova Escola&quot; para adicionar.</p>
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Nome</Th>
              <Th>Rede</Th>
              <Th>Criado em</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => (
              <tr key={school.id}>
                <Td>{school.id}</Td>
                <Td>{school.name}</Td>
                <Td>{networkName(school.networkId)}</Td>
                <Td>{new Date(school.createdAt).toLocaleDateString('pt-BR')}</Td>
                <Td>
                  <EditButton onClick={() => handleEdit(school)}>Editar</EditButton>
                  <DeleteButton onClick={() => handleDelete(school)}>Excluir</DeleteButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <SchoolForm
        open={formOpen}
        mode={formMode}
        initialData={selectedSchool}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmModal
        open={!!deleteConfirm}
        title="Excluir Escola"
        message={`Tem certeza que deseja excluir a escola ${deleteConfirm?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </PageContainer>
  );
}