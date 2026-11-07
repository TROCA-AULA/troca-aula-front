import { test, expect } from './support/fixtures';
import { criarCenario } from './support/api';
import { aviso, entrar, linha } from './support/sessao';

// Jornada docente (com o teto municipal de carga) e fechamento mensal.

test('diretora lança jornada; o teto do município barra o excesso; professor vê a sua', async ({ page, abrirSessao }) => {
  const c = await criarCenario(1);
  const [carla] = c.professores;
  // Município: carga suplementar até 10h por semana.
  await c.master.chamar('POST', '/workload-policies', {
    networkId: c.redeId,
    workloadTypeId: 4,
    maxHoursPerWeek: 10,
    ataOficialRequired: false,
  });

  await entrar(page, c.diretora.email, undefined, '/escola/jornada-docente');
  await expect(page.getByText('Nenhum registro de jornada ainda.')).toBeVisible();

  const lancar = async (tipo: string, horas: string) => {
    await page.getByRole('button', { name: '+ Novo Registro' }).click();
    await page.getByLabel('Professor *').selectOption({ label: carla.nome });
    await page.getByLabel('Tipo de Carga *').selectOption({ label: tipo });
    await page.getByLabel('Horas *').fill(horas);
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  };

  await lancar('Carga suplementar', '6');
  await expect(aviso(page, 'Registro de jornada criado com sucesso')).toBeVisible();
  await expect(linha(page, 'Carga suplementar')).toContainText(carla.nome);
  // A tela mostra as horas como vêm do banco ("6.00h").
  await expect(linha(page, 'Carga suplementar')).toContainText(/6(\.00)?h/);

  // 6h + 6h passa do teto de 10h: o formulário mostra o erro e fica aberto.
  await lancar('Carga suplementar', '6');
  await expect(page.getByRole('heading', { name: 'Novo Registro de Jornada' })).toBeVisible();
  await expect(page.locator('.Toastify__toast--error')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(linha(page, 'Carga suplementar')).toHaveCount(1);

  const p = await abrirSessao(carla.email, undefined, '/minha-jornada');
  const registro = linha(p, 'Carga suplementar');
  await expect(registro).toContainText(c.escola);
  await expect(registro).toContainText(/6(\.00)?h/);
});

test('fechamento mensal: gerar, revisar, fechar e reabrir com justificativa', async ({ page }) => {
  const c = await criarCenario(1);
  const [carla] = c.professores;
  const hoje = new Date();
  await c.diretoraApi.chamar('POST', '/teacher-workload-records', {
    userId: carla.id,
    schoolId: c.escolaId,
    workloadTypeId: 1,
    hours: 20,
    validFrom: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`,
  });

  await entrar(page, c.diretora.email, undefined, '/escola/fechamento-ponto');
  await page.getByLabel('Professor').selectOption({ label: carla.nome });
  await page.getByRole('button', { name: 'Gerar Relatório' }).click();
  await expect(aviso(page, 'Relatório gerado')).toBeVisible();

  const cartao = page.locator('div').filter({ has: page.getByText(carla.nome, { exact: true }) }).filter({ has: page.getByRole('button', { name: 'Baixar PDF' }) }).last();
  await expect(cartao).toContainText('DRAFT');
  // D17: o detalhamento mostra o NOME do tipo de carga, não o código.
  await expect(cartao).toContainText('Horas-aula de interação com alunos');

  // Fechar sem revisar não aparece como opção: primeiro "Revisar".
  await expect(cartao.getByRole('button', { name: 'Fechar' })).toHaveCount(0);
  await cartao.getByRole('button', { name: 'Revisar' }).click();
  await expect(cartao).toContainText('REVIEWED');
  await cartao.getByRole('button', { name: 'Fechar' }).click();
  await expect(cartao).toContainText('CLOSED');

  await cartao.getByRole('button', { name: 'Reabrir para ajuste' }).click();
  await cartao.getByLabel('Motivo da reabertura (fica registrado na auditoria)').fill('curta');
  await cartao.getByRole('button', { name: 'Confirmar reabertura' }).click();
  await expect(cartao.getByText('Descreva o motivo com pelo menos 10 caracteres.')).toBeVisible();

  await cartao.getByLabel('Motivo da reabertura (fica registrado na auditoria)').fill('Horas lançadas em duplicidade no dia 12');
  await cartao.getByRole('button', { name: 'Confirmar reabertura' }).click();
  await expect(aviso(page, 'Relatório reaberto para ajuste')).toBeVisible();
  await expect(cartao).toContainText('DRAFT');

  // O PDF é gerado no navegador e baixado.
  const download = page.waitForEvent('download');
  await cartao.getByRole('button', { name: 'Baixar PDF' }).click();
  expect((await download).suggestedFilename()).toMatch(/^fechamento-\d{4}-\d{2}-professor-\d+\.pdf$/);
});
