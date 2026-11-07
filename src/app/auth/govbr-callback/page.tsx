'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useGovbrAuth } from '@/hooks/useGovbrAuth';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #1351B4;
  margin-bottom: 16px;
`;

const Message = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 24px;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.danger};
  margin-bottom: 24px;
`;

const LinkButton = styled.a`
  display: inline-block;
  padding: 12px 24px;
  background-color: #1351B4;
  color: ${({ theme }) => theme.colors.onPrimary};
  border-radius: 5px;
  text-decoration: none;
  cursor: pointer;
  &:hover {
    background-color: #0c326f;
  }
`;

function GovbrCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithGovbr, isLoading, error } = useGovbrAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      return;
    }

    if (code) {
      loginWithGovbr(code)
        .then((result) => {
          if (result) {
            setStatus('success');
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            setStatus('error');
          }
        })
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [searchParams, loginWithGovbr, router]);

  if (isLoading || status === 'loading') {
    return (
      <Container>
        <Title>Autenticando com Gov.br...</Title>
        <Message>Aguarde enquanto verificamos suas credenciais.</Message>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container>
        <Title>Falha na autenticação</Title>
        <ErrorMessage>
          {error || 'Não foi possível autenticar com Gov.br. Tente novamente.'}
        </ErrorMessage>
        <LinkButton href="/">Voltar para login</LinkButton>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Autenticado com sucesso!</Title>
      <Message>Redirecionando para o dashboard...</Message>
    </Container>
  );
}

export default function GovbrCallbackPage() {
  return (
    <Suspense fallback={
      <Container>
        <Title>Carregando...</Title>
      </Container>
    }>
      <GovbrCallbackContent />
    </Suspense>
  );
}