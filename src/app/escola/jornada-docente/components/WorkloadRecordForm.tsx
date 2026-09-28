'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useTeachers } from '@/hooks/useTeachers';
import { WORKLOAD_TYPES } from '@/types/master';
import type { CreateTeacherWorkloadRecordRequest } from '@/types/workload';

const Overlay = styled.div`
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

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #1e3a5f;
    box-shadow: 0 0 0 2px rgba(30, 58, 95, 0.1);
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #1e3a5f;
    box-shadow: 0 0 0 2px rgba(30, 58, 95, 0.1);
  }
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: #c62828;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
  }
`;

const CancelButton = styled(Button)`
  background: white;
  border: 1px solid #ddd;
  color: #666;

  &:hover {
    background: #f5f5f5;
  }
`;

const SubmitButton = styled(Button)`
  background: #1e3a5f;
  border: none;
  color: white;

  &:hover {
    background: #2a4a73;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

interface WorkloadRecordFormProps {
  open: boolean;
  schoolId: number;
  onClose: () => void;
  onSubmit: (data: CreateTeacherWorkloadRecordRequest) => Promise<unknown>;
}

interface FormData {
  userId: string;
  workloadTypeId: number;
  hours: number;
  validFrom: string;
  validTo?: string;
  ataOficialRef?: string;
  justification?: string;
}

export function WorkloadRecordForm({ open, schoolId, onClose, onSubmit }: WorkloadRecordFormProps) {
  const { linkedTeachers, fetchLinkedTeachers, loading: teachersLoading } = useTeachers(
    schoolId,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchLinkedTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, schoolId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ defaultValues: { validFrom: new Date().toISOString().slice(0, 10) } });

  const submit = async (data: FormData) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        userId: Number(data.userId),
        schoolId,
        workloadTypeId: Number(data.workloadTypeId),
        hours: Number(data.hours),
        validFrom: data.validFrom,
        validTo: data.validTo || undefined,
        ataOficialRef: data.ataOficialRef || undefined,
        justification: data.justification || undefined,
      });
      onClose();
      reset();
    } catch (err: unknown) {
      // O backend rejeita com 400 quando a soma das horas daquele tipo, na
      // rede, ultrapassa o limite configurado em WorkloadPolicies — a
      // mensagem já vem pronta do servidor (ex.: "12h somadas, limite da
      // rede é 10h/semana"), só precisamos exibi-la aqui além do toast
      // global (que já dispara via api-client.service).
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Erro ao criar registro');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Title>Novo Registro de Jornada</Title>
        <Form onSubmit={handleSubmit(submit)}>
          <FormGroup>
            <Label htmlFor="userId">Professor *</Label>
            <Select id="userId" {...register('userId', { required: true })} disabled={teachersLoading}>
              <option value="">Selecione um professor...</option>
              {linkedTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            {errors.userId && <ErrorText>Selecione um professor</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="workloadTypeId">Tipo de Carga *</Label>
            <Select id="workloadTypeId" {...register('workloadTypeId', { required: true, valueAsNumber: true })}>
              <option value="">Selecione...</option>
              {WORKLOAD_TYPES.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
            {errors.workloadTypeId && <ErrorText>Selecione um tipo de carga</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="hours">Horas *</Label>
            <Input
              id="hours"
              type="number"
              min={0.5}
              step={0.5}
              {...register('hours', { required: true, valueAsNumber: true })}
            />
            {errors.hours && <ErrorText>Informe as horas</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="validFrom">Vigência - início *</Label>
            <Input id="validFrom" type="date" {...register('validFrom', { required: true })} />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="validTo">Vigência - fim (opcional)</Label>
            <Input id="validTo" type="date" {...register('validTo')} />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="ataOficialRef">Referência da ata oficial (opcional)</Label>
            <Input id="ataOficialRef" {...register('ataOficialRef')} placeholder="Ex.: ATA-2026-045" />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="justification">Justificativa (opcional)</Label>
            <Input id="justification" {...register('justification')} />
          </FormGroup>

          {error && <ErrorText>{error}</ErrorText>}

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancelar
            </CancelButton>
            <SubmitButton type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </Modal>
    </Overlay>
  );
}
