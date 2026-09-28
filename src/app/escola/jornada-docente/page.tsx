'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useTeacherWorkloadRecords } from '@/hooks/useTeacherWorkloadRecords';
import { useTeachers } from '@/hooks/useTeachers';
import { workloadTypeName } from '@/types/workload';
import { WorkloadRecordForm } from './components/WorkloadRecordForm';

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

  &:hover {
    background-color: #2a4a73;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: #666;
`;

export default function JornadaDocentePage() {
  const { activeSchoolId } = useSchoolContext();
  const { records, loading, createRecord } = useTeacherWorkloadRecords(activeSchoolId);
  const { linkedTeachers, fetchLinkedTeachers } = useTeachers(activeSchoolId ?? 0);
  const [formOpen, setFormOpen] = useState(false);

  // Nomes dos professores não vêm no registro de jornada (só userId) -
  // reaproveita a lista de professores vinculados já buscada pelo form.
  const teacherName = (userId: number) =>
    linkedTeachers.find((t) => t.id === userId)?.name ?? `Professor #${userId}`;

  if (!activeSchoolId) {
    return (
      <PageContainer>
        <EmptyState>Selecione uma escola para continuar.</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Jornada Docente</PageTitle>
        <AddButton
          onClick={() => {
            fetchLinkedTeachers();
            setFormOpen(true);
          }}
        >
          + Novo Registro
        </AddButton>
      </PageHeader>

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : records.length === 0 ? (
        <EmptyState>
          <p>Nenhum registro de jornada ainda.</p>
          <p>Clique em &quot;+ Novo Registro&quot; para adicionar.</p>
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Professor</Th>
              <Th>Tipo de Carga</Th>
              <Th>Horas</Th>
              <Th>Vigência</Th>
              <Th>Ata Oficial</Th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <Td>{teacherName(r.userId)}</Td>
                <Td>{workloadTypeName(r.workloadTypeId)}</Td>
                <Td>{r.hours}h</Td>
                <Td>
                  {new Date(r.validFrom).toLocaleDateString('pt-BR')}
                  {r.validTo ? ` até ${new Date(r.validTo).toLocaleDateString('pt-BR')}` : ' (sem fim)'}
                </Td>
                <Td>{r.ataOficialRef ?? '-'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <WorkloadRecordForm
        open={formOpen}
        schoolId={activeSchoolId}
        onClose={() => setFormOpen(false)}
        onSubmit={createRecord}
      />
    </PageContainer>
  );
}
