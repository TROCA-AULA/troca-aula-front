'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useUsers } from '@/hooks/useUsers';
import { PROFILE } from '@/constants/profile';
import type { School, CreateUserRequest } from '@/types/master';

const Overlay = styled.div`
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

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: ${({ theme }) => theme.shadow.modal};
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
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
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.focusRing};
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: 6px;
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.focusRing};
  }
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
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
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

const CancelButton = styled(Button)`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const SubmitButton = styled(Button)`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  color: ${({ theme }) => theme.colors.onPrimary};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.disabled};
    cursor: not-allowed;
  }
`;

interface UserFormProps {
  open: boolean;
  // Correção: 2|3 era o mapeamento próprio deste módulo (2=Diretor,
  // 3=Administrador), que não batia com o valor real do backend
  // (DIRETOR=1, AUXILIAR_ADMIN=2). Ver src/constants/profile.ts.
  profileId: typeof PROFILE.DIRETOR | typeof PROFILE.AUXILIAR_ADMIN;
  schools: School[];
  onClose: () => void;
  /** Chamado depois de criar: a página recarrega a própria lista (sem F5). */
  onCreated?: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone?: string;
  schoolId: number;
}

export function UserForm({ open, profileId, schools, onClose, onCreated }: UserFormProps) {
  const { createUser } = useUsers(profileId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: { name: '', email: '', phone: '', schoolId: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);

    if (!data.name || data.name.trim().length < 2) {
      setError('Nome é obrigatório e deve ter no mínimo 2 caracteres');
      return;
    }

    if (!data.email || !data.email.includes('@')) {
      setError('Email válido é obrigatório');
      return;
    }

    if (!data.schoolId) {
      setError('Selecionar uma escola é obrigatório');
      return;
    }

    setSubmitting(true);
    try {
      const userData: CreateUserRequest = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        schoolId: data.schoolId,
        profileId,
      };
      await createUser(userData);
      onCreated?.();
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
        <Title>Novo {profileId === PROFILE.DIRETOR ? 'Diretor' : 'Administrador'}</Title>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register('name')} placeholder="Nome completo" />
            {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" />
            {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...register('phone')} placeholder="(11) 99999-9999" />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="schoolId">Escola *</Label>
            <Select id="schoolId" {...register('schoolId', { valueAsNumber: true })}>
              <option value={0}>Selecione uma escola</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
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