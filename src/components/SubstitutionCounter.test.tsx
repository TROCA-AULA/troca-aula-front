import { render, screen } from '@/test-utils';
import { describe, it, expect } from 'vitest';
import { SubstitutionCounter } from './SubstitutionCounter';

describe('SubstitutionCounter', () => {
  it('mostra o estado de carregamento', () => {
    render(<SubstitutionCounter current={0} limit={10} percentage={0} loading />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('mostra o contador normal com ícone verde', () => {
    render(<SubstitutionCounter current={2} limit={10} percentage={20} />);

    expect(screen.getByText('2 de 10')).toBeInTheDocument();
    expect(screen.getByText('🟢')).toBeInTheDocument();
  });

  it('mostra aviso quando o uso chega a 80%', () => {
    render(<SubstitutionCounter current={8} limit={10} percentage={80} />);

    expect(screen.getByText('Atenção: 8 de 10')).toBeInTheDocument();
    expect(screen.getByText('🟡')).toBeInTheDocument();
  });

  it('mostra bloqueio quando o limite é atingido', () => {
    render(<SubstitutionCounter current={10} limit={10} percentage={100} />);

    expect(screen.getByText('Limite atingido (10 de 10)')).toBeInTheDocument();
    expect(screen.getByText('🔴')).toBeInTheDocument();
  });

  it('mostra "sem limite definido" quando não há limite configurado', () => {
    render(<SubstitutionCounter current={3} limit={null} percentage={100} />);

    expect(screen.getByText('Sem limite definido')).toBeInTheDocument();
    expect(screen.getByText('🟢')).toBeInTheDocument();
  });
});
