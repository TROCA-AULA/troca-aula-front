'use client';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useEnrollmentMutations } from '@/hooks/useEnrollment';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useState } from 'react';
import type { EnrollmentStatus } from '@/types/enrollment';
import { toneCss } from '@/styles/tones';
import { ENROLLMENT_TONE, toneOf } from '@/constants/status-tones';

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  padding: 24px;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
`;

const TabHeader = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  width: 100%;
  height: 50px;
  margin-bottom: 20px;
  border-radius: 5px 5px 0 0;

  button {
    border: none;
    background-color: transparent;
    padding: 10px 20px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    text-transform: uppercase;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 12px;

    &:hover {
      background-color: ${({ theme }) => theme.colors.primarySoft};
      color: ${({ theme }) => theme.colors.primary};
    }

    &.active {
      background-color: ${({ theme }) => theme.colors.surface};
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const EnrollmentsTable = styled.table`
  width: 100%;
  text-align: left;
  border-radius: 5px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};

  thead {
    background-color: ${({ theme }) => theme.colors.tableHeader};
  }

  th {
    padding: 10px;
    color: ${({ theme }) => theme.colors.tableHeaderText};
    text-transform: uppercase;
    font-size: 12px;
  }

  tbody {
    tr:nth-child(even) {
      background-color: ${({ theme }) => theme.colors.surfaceAlt};
    }
  }

  td {
    padding: 10px;
    font-size: 14px;
  }
`;

const StatusBadge = styled.span<{ $status: EnrollmentStatus }>`
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
  ${({ $status }) => toneCss(toneOf(ENROLLMENT_TONE, $status))}
`;

const ActionButton = styled.button`
  background-color: ${({ theme }) => theme.colors.danger};
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font-size: 12px;
  text-transform: uppercase;

  &:hover {
    background-color: ${({ theme }) => theme.colors.dangerHover};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabled};
    cursor: not-allowed;
  }
`;

const Loading = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  padding: 40px;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  text-align: center;
  padding: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const FILTER_OPTIONS: { label: string; value: EnrollmentStatus | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Aprovadas', value: 'APPROVED' },
  { label: 'Rejeitadas', value: 'REJECTED' },
  { label: 'Canceladas', value: 'CANCELLED' },
];

export default function MinhasAulasPage() {
  const { user, isLoading: userLoading } = useSchoolContext();
  const router = useRouter();
  const [filter, setFilter] = useState<EnrollmentStatus | 'ALL'>('ALL');
  
  const { enrollments, loading, error, refetch } = useEnrollments(
    user ? { userId: Number(user.id) } : undefined
  );
  const { cancelEnrollment, loading: cancelling } = useEnrollmentMutations();

  if (userLoading) {
    return <Loading>Carregando...</Loading>;
  }

  if (!user) {
    // P5 (problemas-conhecidos.md): '/login' nunca existiu como rota — o
    // login vive em '/' (ver src/app/page.tsx).
    router.push('/');
    return null;
  }

  // Correção: MASTER é profileId=4 (o valor antigo, 1, é DIRETOR — bug real
  // de autorização, ver src/constants/profile.ts).
  if (user.profileId === PROFILE.MASTER) {
    router.push('/master');
    return null;
  }

  const handleCancel = async (enrollmentId: number) => {
    try {
      await cancelEnrollment(enrollmentId);
      toast.success('Candidatura cancelada com sucesso!');
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar candidatura';
      toast.error(message);
    }
  };

  const filteredEnrollments = filter === 'ALL' 
    ? enrollments 
    : enrollments.filter(e => e.status === filter);

  if (loading) {
    return <Loading>Carregando minhas candidaturas...</Loading>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <Wrapper>
      <Title>Minhas Aulas</Title>
      
      <TabHeader>
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={filter === option.value ? 'active' : ''}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </TabHeader>

      {filteredEnrollments.length === 0 ? (
        <EmptyState>
          {filter === 'ALL' 
            ? 'Você ainda não tem candidaturas.'
            : `Nenhuma candidatura ${filter.toLowerCase()}.`}
        </EmptyState>
      ) : (
        <EnrollmentsTable>
          <thead>
            <tr>
              <th>Aula ID</th>
              <th>Status</th>
              <th>Data da Candidatura</th>
              <th>Motivo da Rejeição</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td>#{enrollment.classId}</td>
                <td>
                  <StatusBadge $status={enrollment.status}>
                    {enrollment.status === 'PENDING' && 'Pendente'}
                    {enrollment.status === 'APPROVED' && 'Aprovada'}
                    {enrollment.status === 'REJECTED' && 'Rejeitada'}
                    {enrollment.status === 'CANCELLED' && 'Cancelada'}
                  </StatusBadge>
                </td>
                <td>{format(new Date(enrollment.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                <td>{enrollment.rejectionReason || '-'}</td>
                <td>
                  {enrollment.status === 'PENDING' && (
                    <ActionButton
                      onClick={() => handleCancel(enrollment.id)}
                      disabled={cancelling}
                    >
                      Cancelar
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </EnrollmentsTable>
      )}
    </Wrapper>
  );
}
