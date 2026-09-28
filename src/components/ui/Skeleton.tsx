'use client';

import styled, { keyframes } from 'styled-components';

// P13 (problemas-conhecidos.md): skeleton padronizado para estados de
// carregamento — substitui o texto "Carregando..." nas telas novas.
const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.45; }
  100% { opacity: 1; }
`;

export const Skeleton = styled.div<{ $width?: string; $height?: string }>`
  width: ${({ $width }) => $width ?? '100%'};
  height: ${({ $height }) => $height ?? '16px'};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.surfaceAlt ?? '#e9ecef'};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

const RowsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0;
`;

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <RowsWrapper role="status" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} $height="18px" $width={index % 2 === 0 ? '100%' : '80%'} />
      ))}
    </RowsWrapper>
  );
}
