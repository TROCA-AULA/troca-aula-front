'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useMonthlyClosingReports } from '@/hooks/useMonthlyClosingReports';
import { useTeachers } from '@/hooks/useTeachers';
import { workloadTypeName } from '@/types/workload';
import type { MonthlyClosingReport } from '@/types/workload';

const PageContainer = styled.div`
  padding: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
`;

const GeneratePanel = styled.form`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
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
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #1e3a5f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  height: 40px;

  &:hover {
    background-color: #2a4a73;
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

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $status }) =>
    $status === 'CLOSED' ? '#e8f5e9' : $status === 'REVIEWED' ? '#fff3e0' : '#e3f2fd'};
  color: ${({ $status }) =>
    $status === 'CLOSED' ? '#2e7d32' : $status === 'REVIEWED' ? '#e65100' : '#1976d2'};
`;

const BreakdownList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 12px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BreakdownItem = styled.li`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #333;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    font-weight: 700;
    border-bottom: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: #666;
`;

const ReopenPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed #ddd;
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 64px;
`;

const ReopenError = styled.span`
  font-size: 12px;
  color: #c62828;
`;

interface GenerateFormData {
  userId: string;
  referenceMonth: string;
}

function ReportCard({
  report,
  teacherName,
  onReview,
  onClose,
  onReopen,
}: {
  report: MonthlyClosingReport;
  teacherName: string;
  onReview: (id: number) => Promise<unknown>;
  onClose: (id: number) => Promise<unknown>;
  onReopen: (id: number, justification: string) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [reopenError, setReopenError] = useState<string | null>(null);
  const entries = Object.entries(report.workloadBreakdown ?? {});

  const submitReopen = async () => {
    // Mesmo mínimo do DTO no backend (MinLength(10)) — evita ida e volta.
    if (justification.trim().length < 10) {
      setReopenError('Descreva o motivo com pelo menos 10 caracteres.');
      return;
    }
    setReopenError(null);
    setBusy(true);
    try {
      await onReopen(report.id, justification.trim());
      setReopenOpen(false);
      setJustification('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <strong>{teacherName}</strong> — {report.referenceMonth}
        </div>
        <StatusBadge $status={report.status}>{report.status}</StatusBadge>
      </CardHeader>
      <BreakdownList>
        {entries.map(([key, value]) => (
          <BreakdownItem key={key}>
            <span>{key === 'total' ? 'Total' : workloadTypeName(Number(key)) || key}</span>
            <span>{value}h</span>
          </BreakdownItem>
        ))}
      </BreakdownList>
      {report.status === 'DRAFT' && (
        <SecondaryButton
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onReview(report.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Revisar
        </SecondaryButton>
      )}
      {report.status === 'REVIEWED' && (
        <SecondaryButton
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onClose(report.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Fechar
        </SecondaryButton>
      )}
      {report.status !== 'DRAFT' && !reopenOpen && (
        <SecondaryButton disabled={busy} onClick={() => setReopenOpen(true)}>
          Reabrir para ajuste
        </SecondaryButton>
      )}
      {reopenOpen && (
        <ReopenPanel>
          <Label htmlFor={`justification-${report.id}`}>
            Motivo da reabertura (fica registrado na auditoria)
          </Label>
          <TextArea
            id={`justification-${report.id}`}
            value={justification}
            maxLength={500}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Ex.: horas de março lançadas em duplicidade no dia 12"
          />
          {reopenError && <ReopenError>{reopenError}</ReopenError>}
          <div>
            <SecondaryButton disabled={busy} onClick={submitReopen}>
              Confirmar reabertura
            </SecondaryButton>{' '}
            <SecondaryButton
              disabled={busy}
              onClick={() => {
                setReopenOpen(false);
                setReopenError(null);
              }}
            >
              Cancelar
            </SecondaryButton>
          </div>
        </ReopenPanel>
      )}
    </Card>
  );
}

export default function FechamentoPontoPage() {
  const { activeSchoolId } = useSchoolContext();
  const { reports, loading, generateReport, reviewReport, closeReport, reopenReport } = useMonthlyClosingReports(
    activeSchoolId,
  );
  const { linkedTeachers, fetchLinkedTeachers } = useTeachers(activeSchoolId ?? 0);
  const { register, handleSubmit, reset } = useForm<GenerateFormData>({
    defaultValues: { referenceMonth: new Date().toISOString().slice(0, 7) },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeSchoolId) fetchLinkedTeachers();
  }, [activeSchoolId]);

  const teacherName = (userId: number) =>
    linkedTeachers.find((t) => t.id === userId)?.name ?? `Professor #${userId}`;

  const onGenerate = async (data: GenerateFormData) => {
    if (!activeSchoolId) return;
    setSubmitting(true);
    try {
      await generateReport({
        userId: Number(data.userId),
        schoolId: activeSchoolId,
        referenceMonth: data.referenceMonth,
      });
      reset({ referenceMonth: data.referenceMonth, userId: '' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeSchoolId) {
    return (
      <PageContainer>
        <EmptyState>Selecione uma escola para continuar.</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageTitle>Fechamento de Ponto</PageTitle>

      <GeneratePanel onSubmit={handleSubmit(onGenerate)}>
        <FormGroup>
          <Label htmlFor="userId">Professor</Label>
          <Select id="userId" {...register('userId', { required: true })}>
            <option value="">Selecione...</option>
            {linkedTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="referenceMonth">Mês de referência</Label>
          <Input id="referenceMonth" type="month" {...register('referenceMonth', { required: true })} />
        </FormGroup>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Gerando...' : 'Gerar Relatório'}
        </Button>
      </GeneratePanel>

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : reports.length === 0 ? (
        <EmptyState>Nenhum relatório gerado ainda.</EmptyState>
      ) : (
        reports
          .slice()
          .sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth))
          .map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              teacherName={teacherName(report.userId)}
              onReview={reviewReport}
              onClose={closeReport}
              onReopen={reopenReport}
            />
          ))
      )}
    </PageContainer>
  );
}
