'use client';

import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { StatCard } from '@/components/StatCard';
import {
  PageContainer,
  PageTitle,
  LoadingState,
  EmptyState,
} from '@/components/ui/AdminTable';
import { SkeletonRows } from '@/components/ui/Skeleton';
import styled from 'styled-components';

// P13: estilos locais trocados pelos componentes/tokens compartilhados
// (AdminTable + theme); a página era uma das que repetiam cores hardcoded.
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
`;

export default function DashboardPage() {
  const { stats, loading, error } = useMasterDashboard();

  if (loading) {
    return (
      <PageContainer>
        <PageTitle>Dashboard</PageTitle>
        <LoadingState>
          <SkeletonRows />
        </LoadingState>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageTitle>Dashboard</PageTitle>
        <EmptyState>{error}</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageTitle>Dashboard</PageTitle>
      <StatsGrid>
        <StatCard label="Total de Escolas" value={stats.totalSchools} />
        <StatCard label="Aulas Vagas" value={stats.totalClassesAvailable} />
        <StatCard label="Substituições este mês" value={stats.totalSubstitutionsThisMonth} />
      </StatsGrid>
    </PageContainer>
  );
}