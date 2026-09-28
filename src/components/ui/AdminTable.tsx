'use client';

import styled from 'styled-components';

// P13 (problemas-conhecidos.md): extraído do padrão repetido quase
// byte-a-byte entre `master/redes`, `master/politicas-carga-horaria` e
// outras telas de administração (container + header com título/ação +
// tabela + estados vazio/carregando). Consumido pelas telas novas
// (Auditoria, Jornada do Professor) e pelas que já existiam, incrementalmente.

export const PageContainer = styled.div`
  padding: 24px;
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

export const PageSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 4px 0 0 0;
`;

export const PrimaryButton = styled.button`
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.border};
    cursor: not-allowed;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

export const Th = styled.th`
  text-align: left;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
`;

export const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
`;

export const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  background-color: ${({ theme }) => theme.colors.infoBg};
  color: ${({ theme }) => theme.colors.info};

  &:hover {
    filter: brightness(0.95);
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const LoadingState = styled.div`
  text-align: center;
  padding: 48px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
