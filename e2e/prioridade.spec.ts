import { test, expect } from './support/fixtures';
import { criarCenario } from './support/api';
import { aviso, cartaoAula, entrar } from './support/sessao';

// Prioridade por grupos: quem está no grupo de prioridade 0 vê a vaga na
// hora; quem está sem grupo espera (aqui, 120 min) e não vê ainda.

test('grupo de prioridade criado pela tela muda quem vê a vaga primeiro', async ({ page, abrirSessao }) => {
  const c = await criarCenario(2);
  const [carla, davi] = c.professores;

  await entrar(page, c.diretora.email, undefined, '/escola/prioridade');
  await expect(page.getByText('Nenhum grupo criado — todos veem as vagas na hora.')).toBeVisible();

  await page.getByLabel('Novo grupo').fill('Professores da casa');
  await page.locator('#new-group-delay').fill('0');
  await page.getByRole('button', { name: 'Criar grupo' }).click();
  await expect(aviso(page, 'Grupo criado')).toBeVisible();

  await page.getByRole('checkbox', { name: carla.nome }).check();
  await page.getByRole('button', { name: 'Salvar professores do grupo' }).click();
  await expect(aviso(page, 'Professores do grupo atualizados')).toBeVisible();

  await page.getByLabel('Espera mínima de quem não está em grupo (minutos)').fill('120');
  await page.getByRole('button', { name: 'Salvar configurações' }).click();
  await expect(aviso(page, 'Configurações de prioridade atualizadas')).toBeVisible();

  // Aula criada depois dos grupos.
  await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 2);

  const pc = await abrirSessao(carla.email, undefined, '/classes');
  await expect(cartaoAula(pc, c.disciplina)).toBeVisible();

  const pd = await abrirSessao(davi.email, undefined, '/classes');
  await expect(pd.getByText('Nenhuma aula disponível no momento.')).toBeVisible();

  // Diretora tira a espera de quem está sem grupo: o Davi passa a ver.
  await page.getByLabel('Espera mínima de quem não está em grupo (minutos)').fill('0');
  await page.getByRole('button', { name: 'Salvar configurações' }).click();
  await expect(aviso(page, 'Configurações de prioridade atualizadas')).toBeVisible();
  await pd.reload();
  await expect(cartaoAula(pd, c.disciplina)).toBeVisible();
});

test('grupo de prioridade maior não pode abrir antes do menor', async ({ page }) => {
  const c = await criarCenario(0);
  await c.diretoraApi.chamar('POST', `/schools/${c.escolaId}/teacher-groups`, {
    name: 'Primeiro',
    priority: 0,
    delayMinutes: 60,
  });

  await entrar(page, c.diretora.email, undefined, '/escola/prioridade');
  await page.getByLabel('Novo grupo').fill('Segundo');
  await page.locator('#new-group-priority').fill('1');
  await page.locator('#new-group-delay').fill('30');
  await page.getByRole('button', { name: 'Criar grupo' }).click();

  await expect(page.locator('.Toastify__toast--error')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remover grupo Segundo' })).toHaveCount(0);
});
