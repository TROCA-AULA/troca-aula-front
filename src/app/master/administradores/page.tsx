'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useUsers } from '@/hooks/useUsers';
import { useSchools } from '@/hooks/useSchools';
import { PROFILE } from '@/constants/profile';
import { UserForm } from '../components/UserForm';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { User } from '@/types/master';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  Table,
  Th,
  Td,
  EmptyState,
  LoadingState,
} from '@/components/ui/AdminTable';
import { SkeletonRows } from '@/components/ui/Skeleton';

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
  cursor: margin-right: 8px;

  &:focus {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
  }
`;

const UnlinkButton = styled(ActionButton)`
  background-color: #fff3e0;
  color: #e65100;

  &:hover {
    background-color: #ffe0b2;
  }
`;

export default function AdministradoresPage() {
  const { users, loading, unlinkUser } = useUsers(PROFILE.AUXILIAR_ADMIN);
  const { schools } = useSchools();
  const [formOpen, setFormOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<User | null>(null);

  const handleCreate = () => {
    setFormOpen(true);
  };

  const handleUnlink = (user: User) => {
    setUnlinkConfirm(user);
  };

  const confirmUnlink = async () => {
    if (unlinkConfirm) {
      await unlinkUser(unlinkConfirm.id, unlinkConfirm.profileId, unlinkConfirm.schoolId!);
      setUnlinkConfirm(null);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState><SkeletonRows /></LoadingState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Gerenciar Administradores</PageTitle>
        <AddButton onClick={handleCreate}>+ Novo Administrador</AddButton>
      </PageHeader>

      {users.length === 0 ? (
        <EmptyState>
          <p>Nenhum administrador cadastrado.</p>
          <p>Clique em &quot;+ Novo Administrador&quot; para adicionar.</p>
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Telefone</Th>
              <Th>Escola</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <Td>{user.id}</Td>
                <Td>{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>{user.phone ?? '-'}</Td>
                <Td>{user.schoolId ? schools.find((s) => s.id === user.schoolId)?.name : '-'}</Td>
                <Td>
                  {user.schoolId && (
                    <UnlinkButton onClick={() => handleUnlink(user)}>Desvincular</UnlinkButton>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <UserForm
        open={formOpen}
        profileId={PROFILE.AUXILIAR_ADMIN}
        schools={schools}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmModal
        open={!!unlinkConfirm}
        title="Desvincular Administrador"
        message={`Tem certeza que deseja desvincular o administrador ${unlinkConfirm?.name} da escola? O usuário permanecerá no sistema.`}
        onConfirm={confirmUnlink}
        onCancel={() => setUnlinkConfirm(null)}
        confirmText="Desvincular"
      />
    </PageContainer>
  );
}