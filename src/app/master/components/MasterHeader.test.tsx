import { render, screen } from '@/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { MasterHeader } from './MasterHeader';

vi.mock('@/components/NotificationBell', () => ({
  NotificationBell: () => <span data-testid="sino" />,
}));

describe('MasterHeader', () => {
  it('renderiza título padrão, sino, nome e inicial do usuário', () => {
    render(<MasterHeader userName="Maria" />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Área Administrativa')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByLabelText('Avatar do usuário')).toHaveTextContent('M');
    expect(screen.getByTestId('sino')).toBeInTheDocument();
  });

  it('aceita título customizado e normaliza a inicial', () => {
    render(<MasterHeader title="Painel" userName="  ana" />);

    expect(screen.getByText('Painel')).toBeInTheDocument();
    expect(screen.getByLabelText('Avatar do usuário')).toHaveTextContent('A');
  });

  it('usa "?" quando o nome é vazio', () => {
    render(<MasterHeader userName="   " />);

    expect(screen.getByLabelText('Avatar do usuário')).toHaveTextContent('?');
  });
});
