import { test, expect } from '@playwright/test';
import { cadastrar, criarCenario, sufixo } from './support/api';
import { aviso, cartaoAula, entrar } from './support/sessao';

// Preferências do professor: município onde mora (vale só sem contrato) e
// escolas excluídas.

test('professor sem contrato passa a ver as vagas do município onde mora', async ({ page }) => {
  const c = await criarCenario(0);
  await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 2);
  const s = sufixo();
  const email = `rui.${s}@e2e.local`;
  await cadastrar(`Prof. Rui ${s}`, email, c.disciplinaId); // sem vínculo com escola

  await entrar(page, email, undefined, '/classes');
  await expect(page.getByText('Nenhuma aula disponível no momento.')).toBeVisible();

  await page.goto('/minhas-preferencias');
  await expect(page.getByText('Sem contrato com nenhuma escola')).toBeVisible();
  await page.getByLabel('Município onde mora').selectOption({ label: c.rede });
  await page.getByRole('button', { name: 'Salvar município' }).click();
  await expect(aviso(page, 'Município onde mora atualizado')).toBeVisible();

  await page.goto('/classes');
  await expect(cartaoAula(page, c.disciplina)).toBeVisible();

  // Apagar a cidade volta a esconder a vaga.
  await page.goto('/minhas-preferencias');
  await page.getByLabel('Município onde mora').selectOption({ label: 'Não informado' });
  await page.getByRole('button', { name: 'Salvar município' }).click();
  await expect(aviso(page, 'Município onde mora removido')).toBeVisible();
  await page.goto('/classes');
  await expect(page.getByText('Nenhuma aula disponível no momento.')).toBeVisible();
});

test('professor com contrato é avisado que a residência não muda nada', async ({ page }) => {
  const c = await criarCenario(1);
  await entrar(page, c.professores[0].email, undefined, '/minhas-preferencias');
  await expect(page.getByText('Você já tem contrato com uma escola')).toBeVisible();
});

test('excluir uma escola esconde as vagas dela; desfazer traz de volta', async ({ page }) => {
  const c = await criarCenario(1);
  await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 2);

  await entrar(page, c.professores[0].email, undefined, '/classes');
  await expect(cartaoAula(page, c.disciplina)).toBeVisible();

  await page.goto('/minhas-preferencias');
  await page.getByLabel('Escola', { exact: true }).selectOption({ label: c.escola });
  await page.getByRole('button', { name: 'Excluir escola' }).click();
  await expect(aviso(page, 'Escola excluída das suas vagas')).toBeVisible();

  await page.goto('/classes');
  await expect(page.getByText('Nenhuma aula disponível no momento.')).toBeVisible();

  await page.goto('/minhas-preferencias');
  await page.locator('tr').filter({ hasText: c.escola }).getByRole('button', { name: 'remover' }).click();
  await expect(aviso(page, 'Exclusão removida')).toBeVisible();
  await page.goto('/classes');
  await expect(cartaoAula(page, c.disciplina)).toBeVisible();
});
