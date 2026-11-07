'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSchoolContext } from '@/contexts/SchoolContext';
import {
  COORDINATOR_MASTER_ROUTES,
  PROFILE,
  isCoordinatorOnly,
} from '@/constants/profile';
import { AppShell } from '@/components/app-shell';
import styled from 'styled-components';

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { user, isLoading, schoolLinks } = useSchoolContext();

  // Coordenador municipal entra só nas telas de rede (escolas, redes,
  // políticas e auditoria) — o backend limita tudo à rede dele.
  const coordinator = isCoordinatorOnly(schoolLinks);
  const routeAllowedForCoordinator = COORDINATOR_MASTER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
  const isMaster = user?.profileId === PROFILE.MASTER;
  const hasAccess =
    !!user && (isMaster || (coordinator && routeAllowedForCoordinator));

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
      if (!hasAccess) {
        router.push(coordinator ? '/master/escolas' : '/dashboard');
      }
    }
  }, [user, isLoading, router, hasAccess, coordinator]);

  if (isLoading || !user || !hasAccess) {
    return (
      <LoadingContainer>
        <LoadingText>Carregando...</LoadingText>
      </LoadingContainer>
    );
  }

  // Menu (com as telas de rede para o coordenador) e cabeçalho: AppShell.
  return <AppShell>{children}</AppShell>;
}

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