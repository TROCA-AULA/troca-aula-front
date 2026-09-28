'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { accountService } from '@/services/account.service';

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 24px;
`;

const Card = styled.form`
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: #666;
  margin: 0;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
`;

const Button = styled.button`
  padding: 12px;
  background: #1e3a5f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #2a4a73;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  font-size: 13px;
  color: #c62828;
`;

export default function AlterarSenhaPage() {
  const router = useRouter();
  const { user, isLoading } = useSchoolContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setSubmitting(true);
    try {
      await accountService.changePassword(currentPassword, newPassword);
      toast.success('Senha alterada com sucesso');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao alterar a senha';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <Wrapper>
        <Card as="div">Carregando...</Card>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Card onSubmit={onSubmit}>
        <Title>Alterar senha</Title>
        <Subtitle>
          A nova senha é protegida com bcrypt no servidor; mínimo de 8 caracteres.
        </Subtitle>

        <FormGroup>
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="newPassword">Nova senha</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </Card>
    </Wrapper>
  );
}
