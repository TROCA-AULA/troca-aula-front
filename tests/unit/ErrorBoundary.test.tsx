import { render, screen, fireEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Bomb(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renderiza os filhos quando não há erro', () => {
    render(
      <ErrorBoundary>
        <span>conteúdo ok</span>
      </ErrorBoundary>,
    );

    expect(screen.getByText('conteúdo ok')).toBeInTheDocument();
  });

  it('mostra o fallback e permite tentar novamente quando um filho lança erro', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    // "Tentar novamente" reseta o estado; o filho continua quebrado, então
    // o fallback volta a aparecer (comportamento esperado).
    fireEvent.click(screen.getByText('Tentar novamente'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('usa um fallback customizado quando informado', () => {
    render(
      <ErrorBoundary fallback={<span>fallback custom</span>}>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText('fallback custom')).toBeInTheDocument();
  });
});
