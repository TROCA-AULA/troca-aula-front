'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useTeachers } from '@/hooks/useTeachers';
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

const ActionButton = styled.button<{ $variant?: 'danger' | 'success' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  background-color: ${({ $variant }) =>
    $variant === 'danger'
      ? '#dc3545'
      : $variant === 'success'
        ? '#28a745'
        : '#6c757d'};
  color: white;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #eee;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $active }) => ($active ? '#1e3a5f' : '#666')};
  border-bottom: 2px solid ${({ $active }) => ($active ? '#1e3a5f' : 'transparent')};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #1e3a5f;
  }

  &:focus {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
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
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;

  &:hover {
    color: #333;
  }
`;

const TeacherItem = styled.div`
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const TeacherInfo = styled.div`
  flex: 1;
`;

const TeacherName = styled.div`
  font-weight: 500;
  color: #333;
`;

const TeacherDetails = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ $status }) =>
    $status === 'PENDING'
      ? '#ffc107'
      : $status === 'APPROVED'
        ? '#28a745'
        : '#dc3545'};
  color: ${({ $status }) => ($status === 'PENDING' ? '#000' : '#fff')};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 24px;
  color: #dc3545;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
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
      const { tempPassword } = await accountService.resetUserPassword(userId);
      toast.success(`Senha temporária de ${name}: ${tempPassword}`, {
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
                      <Td>{teacher.subject?.name || '-'}</Td>
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
                      {teacher.email} • {teacher.subject?.name || 'Sem disciplina'} •{' '}
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
