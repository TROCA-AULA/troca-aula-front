'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useMyWorkloadRecords } from '@/hooks/useMyWorkloadRecords';
import { workloadTypeName } from '@/types/workload';
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

// Contraparte de /escola/jornada-docente (visão de gestão, por escola):
// aqui é a visão do próprio professor sobre os registros dele -
// GET /teacher-workload-records/me existia no backend desde a Fase 2 mas
// não tinha nenhuma tela que o consumisse ainda.
export default function MinhaJornadaPage() {
  const router = useRouter();
  const { user, isLoading } = useSchoolContext();
  const { records, loading } = useMyWorkloadRecords();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <PageContainer>
        <LoadingState><SkeletonRows /></LoadingState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Minha Jornada Docente</PageTitle>
          <PageSubtitle>
            Registros de carga horária lançados pela direção de cada escola em que você
            trabalha.
          </PageSubtitle>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState><SkeletonRows /></LoadingState>
      ) : records.length === 0 ? (
        <EmptyState>Nenhum registro de jornada lançado ainda.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Escola</Th>
              <Th>Tipo de Carga</Th>
              <Th>Horas</Th>
              <Th>Vigência</Th>
              <Th>Ata Oficial</Th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <Td>{r.school?.name ?? `Escola #${r.schoolId}`}</Td>
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
    </PageContainer>
  );
}
