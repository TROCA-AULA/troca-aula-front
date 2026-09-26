'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useSchools } from '@/hooks/useSchools';
import { useNetworks } from '@/hooks/useNetworks';
import type { School } from '@/types/master';

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

interface SchoolFormProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: School | null;
  onClose: () => void;
}

interface FormData {
  name: string;
  networkId: number;
}

export function SchoolForm({ open, mode, initialData, onClose }: SchoolFormProps) {
  const { createSchool, updateSchool } = useSchools();
  const { networks, loading: networksLoading } = useNetworks();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: initialData
      ? { name: initialData.name, networkId: initialData.networkId }
      : { name: '', networkId: undefined },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);

    if (!data.name || data.name.trim().length < 2) {
      setError('Nome é obrigatório e deve ter no mínimo 2 caracteres');
      return;
    }

    if (!data.networkId) {
      setError('Rede é obrigatória');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createSchool({ name: data.name, networkId: Number(data.networkId) });
      } else if (initialData) {
        await updateSchool(initialData.id, { name: data.name, networkId: Number(data.networkId) });
      }
      onClose();
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Title>{mode === 'create' ? 'Nova Escola' : 'Editar Escola'}</Title>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register('name')} placeholder="Nome da escola" />
            {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="networkId">Rede de Ensino *</Label>
            <Select
              id="networkId"
              {...register('networkId', { valueAsNumber: true, required: true })}
              disabled={networksLoading}
            >
              <option value="">Selecione uma rede...</option>
              {networks.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.name}
                </option>
              ))}
            </Select>
            {errors.networkId && <ErrorText>Selecione uma rede</ErrorText>}
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