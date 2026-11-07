'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { toast } from 'react-toastify';
import { accountService } from '@/services/account.service';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  Table,
  Th,
  Td,
  LoadingState,
} from '@/components/ui/AdminTable';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { tempPasswordMessage } from '@/utils/temp-password';
import { toneCss } from '@/styles/tones';
import { ENROLLMENT_TONE, toneOf } from '@/constants/status-tones';

const AddButton = styled.button`
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

const ActionButton = styled.button<{ $variant?: 'danger' | 'success' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  background-color: ${({ $variant, theme }) =>
    $variant === 'danger'
      ? theme.colors.danger
      : $variant === 'success'
        ? theme.colors.success
        : theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.borderLight};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 0;
  line-height: 1;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const TeacherItem = styled.div`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const TeacherInfo = styled.div`
  flex: 1;
`;

const TeacherName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const TeacherDetails = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  font-weight: 600;
  ${({ $status }) => toneCss(toneOf(ENROLLMENT_TONE, $status))}
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 24px;
  color: ${({ theme }) => theme.colors.danger};
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 16px;
`;

export default function ProfessoresPage() {
  const [activeTab, setActiveTab] = useState<'professores' | 'candidaturas'>('professores');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [enrollmentFilter, setEnrollmentFilter] = useState<string>('');

  // Correção: antes era um hardcode fixo ('school-1'); agora vem da escola
  // ativa real do usuário (SchoolContext). NOTA: `useTeachers`/`teacherService`
  // ainda assumem um contrato de API (`GET /users?schoolId=&profileId=`,
  // `PATCH /users/:id` com `schoolId`) que o backend atual não implementa mais
  // (ver troca-aula-front/docs/06-status/problemas-conhecidos.md) — corrigir
  // esse hardcode não resolve esse gap maior, que fica documentado como
  // pendência separada.
  const { activeSchoolId } = useSchoolContext();
  // D18: GET /users traz só o subjectId (sem o nome da disciplina).
  const { subjects } = useSubjects();
  const subjectName = (teacher: { subject?: { name: string } | null; subjectId?: number | null }) =>
    teacher.subject?.name ??
    subjects.find((subject) => subject.id === teacher.subjectId)?.name;
  const schoolId = activeSchoolId ?? 0;
  const {
    linkedTeachers,
    availableTeachers,
    enrollmentRequests,
    loading,
    error,
    fetchAvailableTeachers,
    linkTeacher,
    unlinkTeacher,
    fetchEnrollmentRequests,
    updateEnrollmentStatus,
  } = useTeachers(schoolId);

  const handleOpenLinkModal = async () => {
    await fetchAvailableTeachers();
    setShowLinkModal(true);
  };

  const handleLinkTeacher = async (userId: number) => {
    await linkTeacher(userId, schoolId);
    setShowLinkModal(false);
    toast.success('Professor vinculado com sucesso!');
  };

  const handleUnlinkTeacher = async (userId: number) => {
    if (confirm('Tem certeza que deseja desvincular este professor?')) {
      await unlinkTeacher(userId);
      toast.success('Professor desvinculado com sucesso!');
    }
  };

  // Reset de senha por gestor: o servidor gera a senha temporária e devolve
  // uma única vez — mostrada no toast (autoClose: false) para repassar.
  const handleResetPassword = async (userId: number, name: string) => {
    if (!confirm(`Gerar uma nova senha temporária para ${name}?`)) return;
    try {
      const { tempPassword, emailSent } = await accountService.resetUserPassword(userId);
      toast.success(tempPasswordMessage(name, tempPassword, emailSent), {
        autoClose: false,
      });
    } catch {
      toast.error('Erro ao redefinir a senha');
    }
  };

  const handleUpdateEnrollment = async (
    enrollmentId: number,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    await updateEnrollmentStatus(enrollmentId, status);
    toast.success(
      status === 'APPROVED' ? 'Candidatura aprovada!' : 'Candidatura rejeitada!'
    );
  };

  const handleFilterEnrollments = (status: string) => {
    setEnrollmentFilter(status);
    fetchEnrollmentRequests(status || undefined);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Gestão de Professores</PageTitle>
        {activeTab === 'professores' && (
          <AddButton onClick={handleOpenLinkModal} aria-label="Vincular Professor">
            Vincular Professor
          </AddButton>
        )}
      </PageHeader>

      <Tabs role="tablist" aria-label="Abas de gestão de professores">
        <Tab
          role="tab"
          $active={activeTab === 'professores'}
          onClick={() => setActiveTab('professores')}
          aria-selected={activeTab === 'professores'}
        >
          Professores
        </Tab>
        <Tab
          role="tab"
          $active={activeTab === 'candidaturas'}
          onClick={() => setActiveTab('candidaturas')}
          aria-selected={activeTab === 'candidaturas'}
        >
          Candidaturas
        </Tab>
      </Tabs>

      {error && <ErrorMessage>Erro: {error}</ErrorMessage>}

      {activeTab === 'professores' && (
        <div role="tabpanel" aria-labelledby="tab-professores">
          {loading ? (
            <LoadingState><SkeletonRows /></LoadingState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Email</Th>
                  <Th>Disciplina</Th>
                  <Th>Substituições</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {linkedTeachers.length === 0 ? (
                  <tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      Nenhum professor vinculado
                    </Td>
                  </tr>
                ) : (
                  linkedTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <Td>{teacher.name}</Td>
                      <Td>{teacher.email}</Td>
                      <Td>{subjectName(teacher) || '-'}</Td>
                      <Td>{teacher.totalSubstitutions}</Td>
                      <Td>
                        <ActionButton
                          onClick={() => handleResetPassword(teacher.id, teacher.name)}
                          aria-label={`Redefinir senha de ${teacher.name}`}
                        >
                          Redefinir senha
                        </ActionButton>
                        <ActionButton
                          $variant="danger"
                          onClick={() => handleUnlinkTeacher(teacher.id)}
                          aria-label={`Desvincular ${teacher.name}`}
                        >
                          Desvincular
                        </ActionButton>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {activeTab === 'candidaturas' && (
        <div role="tabpanel" aria-labelledby="tab-candidaturas">
          <FilterSelect
            value={enrollmentFilter}
            onChange={(e) => handleFilterEnrollments(e.target.value)}
            aria-label="Filtrar candidaturas por status"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendentes</option>
            <option value="APPROVED">Aprovadas</option>
            <option value="REJECTED">Rejeitadas</option>
          </FilterSelect>

          {loading ? (
            <LoadingState><SkeletonRows /></LoadingState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Candidato</Th>
                  <Th>Email</Th>
                  <Th>Disciplina</Th>
                  <Th>Substituições</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {enrollmentRequests.length === 0 ? (
                  <tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      Nenhuma candidatura encontrada
                    </Td>
                  </tr>
                ) : (
                  enrollmentRequests.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <Td>{enrollment.user?.name || '-'}</Td>
                      <Td>{enrollment.user?.email || '-'}</Td>
                      <Td>{enrollment.user?.subject?.name || '-'}</Td>
                      <Td>{enrollment.user?.totalSubstitutions || 0}</Td>
                      <Td>
                        <StatusBadge $status={enrollment.status}>
                          {enrollment.status === 'PENDING'
                            ? 'Pendente'
                            : enrollment.status === 'APPROVED'
                              ? 'Aprovada'
                              : 'Rejeitada'}
                        </StatusBadge>
                      </Td>
                      <Td>
                        {enrollment.status === 'PENDING' && (
                          <>
                            <ActionButton
                              $variant="success"
                              onClick={() =>
                                handleUpdateEnrollment(enrollment.id, 'APPROVED')
                              }
                              aria-label={`Aprovar candidatura de ${enrollment.user?.name}`}
                            >
                              Aprovar
                            </ActionButton>
                            <ActionButton
                              $variant="danger"
                              onClick={() =>
                                handleUpdateEnrollment(enrollment.id, 'REJECTED')
                              }
                              aria-label={`Rejeitar candidatura de ${enrollment.user?.name}`}
                            >
                              Rejeitar
                            </ActionButton>
                          </>
                        )}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {showLinkModal && (
        <Modal onClick={() => setShowLinkModal(false)} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle id="modal-title">Vincular Professor</ModalTitle>
              <CloseButton onClick={() => setShowLinkModal(false)} aria-label="Fechar modal">×</CloseButton>
            </ModalHeader>

            {availableTeachers.length === 0 ? (
              <p>Nenhum professor disponível para vínculo.</p>
            ) : (
              availableTeachers.map((teacher) => (
                <TeacherItem key={teacher.id}>
                  <TeacherInfo>
                    <TeacherName>{teacher.name}</TeacherName>
                    <TeacherDetails>
                      {teacher.email} • {subjectName(teacher) || 'Sem disciplina'} •{' '}
                      {teacher.totalSubstitutions} substituições
                    </TeacherDetails>
                  </TeacherInfo>
                  <ActionButton
                    $variant="success"
                    onClick={() => handleLinkTeacher(teacher.id)}
                    aria-label={`Vincular ${teacher.name}`}
                  >
                    Vincular
                  </ActionButton>
                </TeacherItem>
              ))
            )}
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
}
