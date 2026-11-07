import { describe, it, expect, vi } from 'vitest';
import MasterPage from './page';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('MasterPage', () => {
  it('redireciona para o dashboard do master', () => {
    // Componente sem hooks/JSX: chama a função diretamente (o redirect real
    // lança/redireciona; aqui só verificamos a chamada).
    MasterPage();

    expect(redirect).toHaveBeenCalledWith('/master/dashboard');
  });
});
