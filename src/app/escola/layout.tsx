'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE, isSchoolScopedStaffProfile } from '@/constants/profile';
import { AppShell } from '@/components/app-shell';

// Área nova (diferente de /master/*, que é MASTER-only): jornada docente e
// fechamento de ponto são operados no dia a dia por DIRETOR/AUXILIAR_ADMIN
// da própria escola, não só pelo administrador global da plataforma. O
// /dashboard legado já está descrito como sobrecarregado em outras partes
// do projeto (docs/06-status/problemas-conhecidos.md), então em vez de
// espremer mais telas ali, esta área tem rotas próprias, com um guard mais
// permissivo que o de /master (DIRETOR/AUXILIAR_ADMIN OU MASTER). O menu e o
// cabeçalho vêm do AppShell, comum a todas as telas logadas.

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 16px;
`;

export default function EscolaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useSchoolContext();

  const hasAccess =
    !!user &&
    (user.profileId === PROFILE.MASTER || isSchoolScopedStaffProfile(user.profileId));

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // P5 (problemas-conhecidos.md): '/login' nunca existiu como rota —
        // o login vive em '/' (ver src/app/page.tsx).
        router.push('/');
        return;
      }
      if (!hasAccess) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, hasAccess, router]);

  if (isLoading || !user || !hasAccess) {
    return (
      <LoadingContainer>
        <LoadingText>Carregando...</LoadingText>
      </LoadingContainer>
    );
  }

  return <AppShell>{children}</AppShell>;
}
