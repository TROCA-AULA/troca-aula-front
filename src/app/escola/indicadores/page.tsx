'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useCoverageStats } from '@/hooks/useCoverageStats';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { downloadCsv } from '@/utils/csv';
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

// Fase 4 do Design Doc: indicador estatístico simples de risco de aula vaga
// (GET /classes/coverage-stats) + histórico de substituições aprovadas da
// escola, com exportação CSV (Excel) e impressão (PDF via navegador).
// A heurística de nível é do servidor — aqui só exibimos.
const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardLabel = styled.div`
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const CardValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1e3a5f;
  margin-top: 6px;
`;

const NivelBadge = styled.span<{ $nivel: 'baixo' | 'medio' | 'alto' }>`
  display: inline-block;
  margin-top: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  text-transform: capitalize;
  background: ${({ $nivel }) =>
    $nivel === 'baixo' ? '#e8f5e9' : $nivel === 'medio' ? '#fff3e0' : '#ffebee'};
  color: ${({ $nivel }) =>
    $nivel === 'baixo' ? '#2e7d32' : $nivel === 'medio' ? '#e65100' : '#c62828'};
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #333;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 180px;
`;

const Button = styled.button`
  padding: 9px 16px;
  background: #1e3a5f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #2a4a73;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: white;
  color: #1e3a5f;
  border: 1px solid #1e3a5f;

  &:hover {
    background: #f0f4f8;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 24px 0 12px;
`;

const Hint = styled.p`
  font-size: 12px;
  color: #777;
  margin: 0 0 16px;
`;

const NoPrint = styled.div`
  @media print {
    display: none;
  }
`;

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
}

export default function IndicadoresPage() {
  const { activeSchoolId } = useSchoolContext();
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);

  const { stats, loading, error } = useCoverageStats(
    activeSchoolId ?? undefined,
    subjectId,
    dayOfWeek,
  );
  const { subjects } = useSubjects();
  const {
    enrollmentRequests,
    fetchEnrollmentRequests,
    loading: historyLoading,
  } = useTeachers(activeSchoolId ?? 0);

  useEffect(() => {
    if (activeSchoolId) {
      fetchEnrollmentRequests('APPROVED');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSchoolId]);

  const exportHistoryCsv = () => {
    const header = [
      'Professor',
      'Aula',
      'Status',
      'Tempo de casa (desde)',
      'Candidatura em',
    ];
    const rows = enrollmentRequests.map((request) => [
      request.user?.name ?? `Professor #${request.professorId}`,
      `#${request.classId}`,
      request.status,
      formatDate(request.schoolSince ?? undefined),
      formatDate(request.createdAt),
    ]);
    const today = format(new Date(), 'yyyy-MM-dd');
    downloadCsv(`substituicoes-aprovadas-escola-${activeSchoolId}-${today}.csv`, [
      header,
      ...rows,
    ]);
  };

  if (!activeSchoolId) {
    return (
      <PageContainer>
        <PageTitle>Indicadores</PageTitle>
        <EmptyState>Selecione uma escola para ver os indicadores.</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Indicadores</PageTitle>
          <PageSubtitle>
            Risco de aula vaga e histórico de substituições da escola ativa.
          </PageSubtitle>
        </div>
      </PageHeader>

      <NoPrint>
        <FilterBar>
          <FormGroup>
            <Label htmlFor="subjectFilter">Disciplina</Label>
            <Select
              id="subjectFilter"
              value={subjectId ?? ''}
              onChange={(e) =>
                setSubjectId(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Todas</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="dayFilter">Dia da semana</Label>
            <Select
              id="dayFilter"
              value={dayOfWeek ?? ''}
              onChange={(e) =>
                setDayOfWeek(e.target.value !== '' ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Todos</option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </Select>
          </FormGroup>
        </FilterBar>
      </NoPrint>

      {loading ? (
        <LoadingState>Carregando indicador...</LoadingState>
      ) : error ? (
        <EmptyState>{error}</EmptyState>
      ) : (
        stats && (
          <>
            <Cards>
              <Card>
                <CardLabel>Aulas vagas no recorte</CardLabel>
                <CardValue>{stats.totalVagas}</CardValue>
              </Card>
              <Card>
                <CardLabel>Vagas cobertas</CardLabel>
                <CardValue>{stats.cobertas}</CardValue>
              </Card>
              <Card>
                <CardLabel>Taxa de cobertura</CardLabel>
                <CardValue>{Math.round(stats.taxaCobertura * 100)}%</CardValue>
              </Card>
              <Card>
                <CardLabel>Risco de não-cobertura</CardLabel>
                <NivelBadge $nivel={stats.nivel}>{stats.nivel}</NivelBadge>
              </Card>
            </Cards>
            <Hint>
              Heurística do servidor sobre o histórico de aulas vagas: ≥70% de cobertura =
              risco baixo · 40–70% = médio · abaixo de 40% (ou sem histórico) = alto. Não é
              um modelo preditivo.
            </Hint>
          </>
        )
      )}

      <PageHeader>
        <SectionTitle>Substituições aprovadas</SectionTitle>
        <NoPrint>
          <div style={{ display: 'flex', gap: 8 }}>
            <SecondaryButton
              onClick={exportHistoryCsv}
              disabled={enrollmentRequests.length === 0}
            >
              Exportar CSV
            </SecondaryButton>
            <SecondaryButton onClick={() => window.print()}>Imprimir / PDF</SecondaryButton>
          </div>
        </NoPrint>
      </PageHeader>

      {historyLoading ? (
        <LoadingState>Carregando histórico...</LoadingState>
      ) : enrollmentRequests.length === 0 ? (
        <EmptyState>Nenhuma substituição aprovada registrada para a escola ativa.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Professor</Th>
              <Th>Aula</Th>
              <Th>Tempo de casa (desde)</Th>
              <Th>Candidatura em</Th>
            </tr>
          </thead>
          <tbody>
            {enrollmentRequests.map((request) => (
              <tr key={request.id}>
                <Td>{request.user?.name ?? `Professor #${request.professorId}`}</Td>
                <Td>#{request.classId}</Td>
                <Td>{formatDate(request.schoolSince ?? undefined)}</Td>
                <Td>{formatDate(request.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageContainer>
  );
}
