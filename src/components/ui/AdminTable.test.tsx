import { render, screen } from '@/test-utils';
import { describe, it, expect } from 'vitest';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  PageSubtitle,
  PrimaryButton,
  Table,
  Th,
  Td,
  ActionButton,
  EmptyState,
  LoadingState,
} from './AdminTable';

describe('AdminTable', () => {
  it('renderiza o cabeçalho da página com título, subtítulo e ação', () => {
    render(
      <PageContainer>
        <PageHeader>
          <div>
            <PageTitle>Auditoria</PageTitle>
            <PageSubtitle>Últimos eventos</PageSubtitle>
          </div>
          <PrimaryButton>Exportar</PrimaryButton>
        </PageHeader>
      </PageContainer>,
    );

    expect(screen.getByText('Auditoria')).toBeInTheDocument();
    expect(screen.getByText('Últimos eventos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
  });

  it('renderiza a tabela com cabeçalho, linhas e ação', () => {
    render(
      <Table>
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>Maria</Td>
            <Td>
              <ActionButton>Ver</ActionButton>
            </Td>
          </tr>
        </tbody>
      </Table>,
    );

    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Maria' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
  });

  it('renderiza os estados de vazio e carregando', () => {
    render(
      <>
        <EmptyState>Nada por aqui</EmptyState>
        <LoadingState>Carregando...</LoadingState>
      </>,
    );

    expect(screen.getByText('Nada por aqui')).toBeInTheDocument();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });
});
