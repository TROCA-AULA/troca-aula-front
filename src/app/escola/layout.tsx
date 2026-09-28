'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE, isSchoolScopedStaffProfile } from '@/constants/profile';
import { EscolaSidebar } from './components/EscolaSidebar';

// Área nova (diferente de /master/*, que é MASTER-only): jornada docente e
// fechamento de ponto são operados no dia a dia por DIRETOR/AUXILIAR_ADMIN
// da própria escola, não só pelo administrador global da plataforma. O
// /dashboard legado já está descrito como sobrecarregado em outras partes
// do projeto (docs/06-status/problemas-conhecidos.md), então em vez de
// espremer mais duas telas ali, seguimos o mesmo padrão de layout+sidebar
// já usado em /master (ver master/layout.tsx), só que com um guard mais
// permissivo (DIRETOR/AUXILIAR_ADMIN OU MASTER, não só MASTER).
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  flex-shrink: 0;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 24px;
  background-color: #f5f5f5;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`;

const LoadingText = styled.p`
  color: #666;
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

  return (
    <LayoutContainer>
      <SidebarWrapper>
        <EscolaSidebar />
      </SidebarWrapper>
      <MainContent>{children}</MainContent>
    </LayoutContainer>
  );
}
