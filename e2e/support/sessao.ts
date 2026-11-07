import { expect, type Locator, type Page } from '@playwright/test';
import { SENHA } from './api';

/**
 * Entra pela rota de login do próprio front (a mesma que a tela usa), que
 * grava o cookie httpOnly de sessão no navegador do teste. Mais rápido que
 * preencher o formulário; o formulário em si é testado em autenticacao.spec.
 */
export async function entrar(page: Page, email: string, senha = SENHA, destino = '/dashboard') {
  const res = await page.request.post('/api/auth/login', { data: { email, password: senha } });
  expect(res.ok(), `login de ${email} pelo front`).toBeTruthy();
  await page.goto(destino);
}

/** Último aviso (toast) que contém o texto. */
export function aviso(page: Page, texto: string | RegExp): Locator {
  return page.locator('.Toastify__toast').filter({ hasText: texto }).last();
}

/** Linha de tabela que contém o texto. */
export function linha(escopo: Page | Locator, texto: string | RegExp): Locator {
  return escopo.locator('tr').filter({ hasText: texto });
}

/** Valor para <input type="datetime-local"> N dias à frente, no fuso do navegador. */
export function dataHoraLocal(diasAFrente: number, hora: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(hora)}:00`;
}

/** Tira a senha temporária do aviso "Senha temporária de X: SENHA (o e-mail...)". */
export async function senhaTemporariaDoAviso(page: Page): Promise<string> {
  const texto = await aviso(page, 'Senha temporária de').innerText();
  const achou = texto.match(/Senha temporária de .+?: (\S+) \(/);
  expect(achou, `senha no aviso: ${texto}`).not.toBeNull();
  return achou![1];
}

/** Cartão de aula em /classes, achado pelo nome da disciplina. */
export function cartaoAula(page: Page, disciplina: string): Locator {
  return page.getByText(disciplina, { exact: true }).locator('xpath=../..');
}
