'use client';

import { Component, type ReactNode } from 'react';
import styled from 'styled-components';

// P13 (problemas-conhecidos.md): Error Boundary global — sem isso, um erro
// de render em qualquer tela derruba a aplicação inteira (tela branca do
// Next em produção). Montado no layout raiz (src/app/layout.tsx).

const Fallback = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
`;

const FallbackTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text ?? '#333'};
  margin: 0;
`;

const FallbackText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted ?? '#666'};
  margin: 0;
`;

const RetryButton = styled.button`
  margin-top: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary ?? '#1e3a5f'};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary capturou um erro de render:', error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <Fallback role="alert">
            <FallbackTitle>Algo deu errado</FallbackTitle>
            <FallbackText>
              Ocorreu um erro inesperado ao renderizar esta página. Tente novamente; se
              persistir, avise a equipe.
            </FallbackText>
            <RetryButton onClick={this.handleRetry}>Tentar novamente</RetryButton>
          </Fallback>
        )
      );
    }

    return this.props.children;
  }
}
