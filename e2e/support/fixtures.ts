import { test as base, type Page } from '@playwright/test';
import { SENHA } from './api';
import { entrar } from './sessao';

type AbrirSessao = (email: string, senha?: string, destino?: string) => Promise<Page>;

/**
 * `test` com a fixture `abrirSessao`: abre um navegador separado (outra
 * pessoa) já logado. Os navegadores abertos são fechados no fim do teste.
 */
export const test = base.extend<{ abrirSessao: AbrirSessao }>({
  abrirSessao: async ({ browser }, use) => {
    const abertos: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await use(async (email, senha = SENHA, destino = '/dashboard') => {
      const context = await browser.newContext();
      abertos.push(context);
      const page = await context.newPage();
      await entrar(page, email, senha, destino);
      return page;
    });
    for (const context of abertos) await context.close();
  },
});

export { expect } from '@playwright/test';
