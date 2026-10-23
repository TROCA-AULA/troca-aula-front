'use client';
import styled from 'styled-components';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useEnrollmentMutations } from '@/hooks/useEnrollment';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useState } from 'react';
import type { EnrollmentRequest, EnrollmentStatus } from '@/types/enrollment';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toneCss } from '@/styles/tones';
import { ENROLLMENT_TONE, toneOf } from '@/constants/status-tones';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TabHeader = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  width: 100%;
  height: 50px;
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

const ActionButton = styled.button<{ $variant?: 'approve' | 'reject' }>`
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  color: ${({ theme }) => theme.colors.onPrimary};
  cursor: pointer;
  font-size: 12px;
  text-transform: uppercase;
  margin-right: 5px;
  background-color: ${({ $variant, theme }) =>
    $variant === 'approve' ? theme.colors.success : theme.colors.danger};

  &:hover {
    background-color: ${({ $variant, theme }) =>
      $variant === 'approve' ? theme.colors.successHover : theme.colors.dangerHover};
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

const ReasonInput = styled.textarea`
  width: 100%;
  min-height: 72px;
  margin: 0 0 16px;
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: 6px;
  font: inherit;
  box-sizing: border-box;
`;

const Muted = styled.span`
  display: block;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

// D15: nome do professor e dados da aula em vez de "Professor #26" / "#8".
function professorLabel(enrollment: EnrollmentRequest) {
  return enrollment.user?.name ?? `Professor #${enrollment.professorId}`;
}

function classLabel(enrollment: EnrollmentRequest) {
  const info = enrollment.class;
  if (!info?.statededAt) return { main: `Aula #${enrollment.classId}`, extra: null };
  const start = new Date(info.statededAt);
  const end = info.finishedAt ? format(new Date(info.finishedAt), 'HH:mm') : null;
  const when = `${format(start, 'dd/MM/yyyy HH:mm')}${end ? `–${end}` : ''}`;
  return {
    main: info.subjectName ? `${info.subjectName} · ${when}` : when,
    extra: info.schoolName,
  };
}

const FILTER_OPTIONS: { label: string; value: EnrollmentStatus | 'ALL' }[] = [
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Aprovadas', value: 'APPROVED' },
  { label: 'Rejeitadas', value: 'REJECTED' },
];

interface EnrollmentsListProps {
  schoolId?: number;
}

export function EnrollmentsList({ schoolId }: EnrollmentsListProps) {
  const [filter, setFilter] = useState<EnrollmentStatus | 'ALL'>('PENDING');
  
  const { enrollments, loading, error, refetch } = useEnrollments(
    { status: filter === 'ALL' ? undefined : filter, schoolId }
  );
  const { approveEnrollment, rejectEnrollment, loading: processing } = useEnrollmentMutations();
  const [rejecting, setRejecting] = useState<EnrollmentRequest | null>(null);
  const [reason, setReason] = useState('');

  const handleApprove = async (enrollmentId: number) => {
    try {
      await approveEnrollment(enrollmentId);
      toast.success('Candidatura aprovada com sucesso!');
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aprovar candidatura';
      toast.error(message);
    }
  };

  const openReject = (enrollment: EnrollmentRequest) => {
    setReason('');
    setRejecting(enrollment);
  };

  const confirmReject = async () => {
    const enrollment = rejecting;
    setRejecting(null);
    if (!enrollment) return;
    try {
      await rejectEnrollment(enrollment.id, reason.trim() || undefined);
      toast.success('Candidatura rejeitada!');
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao rejeitar candidatura';
      toast.error(message);
    }
  };

  if (loading) {
    return <Loading>Carregando candidaturas...</Loading>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <Container>
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

      {enrollments.length === 0 ? (
        <EmptyState>
          Nenhuma candidatura {filter !== 'ALL' ? filter.toLowerCase() : ''} encontrada.
        </EmptyState>
      ) : (
        <EnrollmentsTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Professor</th>
              <th>Aula</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td>#{enrollment.id}</td>
                <td>{professorLabel(enrollment)}</td>
                <td>
                  {classLabel(enrollment).main}
                  {classLabel(enrollment).extra && (
                    <Muted>{classLabel(enrollment).extra}</Muted>
                  )}
                </td>
                <td>
                  <StatusBadge $status={enrollment.status}>
                    {enrollment.status === 'PENDING' && 'Pendente'}
                    {enrollment.status === 'APPROVED' && 'Aprovada'}
                    {enrollment.status === 'REJECTED' && 'Rejeitada'}
                    {enrollment.status === 'CANCELLED' && 'Cancelada'}
                  </StatusBadge>
                </td>
                <td>{format(new Date(enrollment.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                <td>
                  {enrollment.status === 'PENDING' && (
                    <>
                      <ActionButton
                        $variant="approve"
                        onClick={() => handleApprove(enrollment.id)}
                        disabled={processing}
                      >
                        Aprovar
                      </ActionButton>
                      <ActionButton
                        $variant="reject"
                        onClick={() => openReject(enrollment)}
                        disabled={processing}
                      >
                        Rejeitar
                      </ActionButton>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </EnrollmentsTable>
      )}

      <ConfirmModal
        open={rejecting != null}
        title="Rejeitar candidatura"
        message={`Rejeitar a candidatura de ${rejecting ? professorLabel(rejecting) : ''}? O motivo aparece para o professor em "Minhas aulas".`}
        confirmText="Rejeitar"
        onConfirm={confirmReject}
        onCancel={() => setRejecting(null)}
      >
        <ReasonInput
          aria-label="Motivo da rejeição (opcional)"
          placeholder="Motivo (opcional)"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </ConfirmModal>
    </Container>
  );
}
