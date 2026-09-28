'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';
import { MasterSidebar } from './components/MasterSidebar';
import { MasterHeader } from './components/MasterHeader';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  flex-shrink: 0;
`;

const ContentColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 24px;
  background-color: #f5f5f5;
`;

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useSchoolContext();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // P5 (problemas-conhecidos.md): '/login' nunca existiu como rota —
        // o login vive em '/' (ver src/app/page.tsx).
        router.push('/');
        return;
      }
      // Correção: MASTER é profileId=4 (o valor antigo, 1, é DIRETOR —
      // bug real de autorização, ver src/constants/profile.ts).
      if (user.profileId !== PROFILE.MASTER) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.profileId !== PROFILE.MASTER) {
    return (
      <LoadingContainer>
        <LoadingText>Carregando...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <LayoutContainer>
      <SidebarWrapper>
        <MasterSidebar />
      </SidebarWrapper>
      <ContentColumn>
        <MasterHeader userName={user.name} />
        <MainContent>{children}</MainContent>
      </ContentColumn>
    </LayoutContainer>
  );
}

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