import { test, expect } from './support/fixtures';
import { cadastrar, criarCenario, PERFIL, sufixo } from './support/api';
import { aviso, cartaoAula, dataHoraLocal, entrar, linha } from './support/sessao';

// O fluxo principal do produto, com três pessoas em navegadores separados:
// a diretora publica a aula vaga, dois professores se candidatam, a diretora
// aprova um e rejeita o outro com motivo, e cada um vê o resultado.

test('aula vaga: publicar, candidatar, aprovar e rejeitar com motivo', async ({ page, abrirSessao }) => {
  const c = await criarCenario(2);
  const [carla, davi] = c.professores;

  // 1. Diretora publica a aula pelo painel.
  await entrar(page, c.diretora.email);
  await expect(page.locator('input[disabled]')).toHaveValue(c.escola);
  await page.locator('select[name="subject"]').selectOption({ label: c.disciplina });
  await page.getByPlaceholder('Inicio').fill(dataHoraLocal(2, 8));
  await page.getByPlaceholder('Termino').fill(dataHoraLocal(2, 9));
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await expect(aviso(page, 'Aula cadastrada com sucesso')).toBeVisible();
  await expect(linha(page, c.disciplina)).toBeVisible();

  // 2. Os dois professores veem a aula da sua disciplina e se candidatam.
  for (const prof of [carla, davi]) {
    const p = await abrirSessao(prof.email, undefined, '/classes');
    const cartao = cartaoAula(p, c.disciplina);
    await expect(cartao).toBeVisible();
    await cartao.getByRole('button', { name: 'Candidatar-se' }).click();
    await expect(aviso(p, 'Candidatura enviada com sucesso!')).toBeVisible();
    await p.context().close();
  }

  // 3. Diretora vê as candidaturas com nome e aula (D15), aprova a Carla...
  await page.getByRole('button', { name: 'Candidaturas' }).click();
  const linhaCarla = linha(page, carla.nome);
  const linhaDavi = linha(page, davi.nome);
  await expect(linhaCarla).toContainText(c.disciplina);
  await expect(linhaCarla).toContainText(c.escola);
  await linhaCarla.getByRole('button', { name: 'Aprovar' }).click();
  await expect(aviso(page, 'Candidatura aprovada com sucesso!')).toBeVisible();

  // ...e rejeita o Davi informando o motivo (D20).
  await linhaDavi.getByRole('button', { name: 'Rejeitar' }).click();
  const dialogo = page.getByRole('alertdialog');
  await dialogo.getByLabel('Motivo da rejeição (opcional)').fill('Já temos substituto neste dia');
  await dialogo.getByRole('button', { name: 'Rejeitar' }).click();
  await expect(aviso(page, 'Candidatura rejeitada!')).toBeVisible();
  await expect(page.getByText('Nenhuma candidatura pending encontrada.')).toBeVisible();

  // 4. Sem recarregar (D14), a aula aparece em "Aulas aceitas" com a Carla.
  await page.getByRole('button', { name: 'Aulas aceitas' }).click();
  await expect(linha(page, c.disciplina)).toContainText(carla.nome);

  // 5. Cada professor vê o próprio resultado em "Minhas aulas".
  const pc = await abrirSessao(carla.email, undefined, '/minhas-aulas');
  await expect(pc.getByText('Aprovada', { exact: true })).toBeVisible();
  await pc.goto('/dashboard');
  await pc.getByRole('button', { name: 'Minhas Aulas' }).click();
  await expect(linha(pc, c.disciplina)).toBeVisible();

  const pd = await abrirSessao(davi.email, undefined, '/minhas-aulas');
  const rejeitada = linha(pd, 'Rejeitada');
  await expect(rejeitada).toContainText('Já temos substituto neste dia');
});

test('professor cancela a própria candidatura', async ({ page }) => {
  const c = await criarCenario(1);
  const [carla] = c.professores;
  const aula = await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 3);
  await entrar(page, carla.email, undefined, '/classes');
  await cartaoAula(page, c.disciplina).getByRole('button', { name: 'Candidatar-se' }).click();
  await expect(aviso(page, 'Candidatura enviada com sucesso!')).toBeVisible();

  await page.goto('/minhas-aulas');
  const pendente = linha(page, `#${aula}`);
  await expect(pendente).toContainText('Pendente');
  await pendente.getByRole('button', { name: 'Cancelar' }).click();
  await expect(aviso(page, 'Candidatura cancelada com sucesso!')).toBeVisible();
  await expect(linha(page, `#${aula}`)).toContainText('Cancelada');
});

test('professor só vê aulas da própria disciplina', async ({ page }) => {
  const c = await criarCenario(0);
  const s = sufixo();
  const historia = await c.master.criarDisciplina(`História ${s}`);
  const eva = await cadastrar(`Prof. Eva ${s}`, `eva.${s}@e2e.local`, historia);
  await c.diretoraApi.vincular(eva, PERFIL.PROFESSOR, c.escolaId);
  await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 2);
  await c.diretoraApi.criarAula(c.escolaId, historia, c.diretora.id, 3);

  await entrar(page, `eva.${s}@e2e.local`, undefined, '/classes');
  await expect(cartaoAula(page, `História ${s}`)).toBeVisible();
  await expect(page.getByText(c.disciplina, { exact: true })).toHaveCount(0);
});

test('diretora remove uma aula vaga ainda sem professor', async ({ page }) => {
  const c = await criarCenario(0);
  await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 4);

  await entrar(page, c.diretora.email);
  const aula = linha(page, c.disciplina);
  await aula.getByRole('button', { name: 'deletar' }).click();
  await expect(aviso(page, 'Aula removida com sucesso')).toBeVisible();
  await expect(linha(page, c.disciplina)).toHaveCount(0);
});

test('professor sem disciplina vê o aviso em vez de uma lista vazia', async ({ page }) => {
  const c = await criarCenario(0);
  const s = sufixo();
  const id = await cadastrar(`Prof. Nina ${s}`, `nina.${s}@e2e.local`);
  await c.diretoraApi.vincular(id, PERFIL.PROFESSOR, c.escolaId);

  await entrar(page, `nina.${s}@e2e.local`);
  await expect(page.getByRole('alert').filter({ hasText: 'Sua disciplina não está cadastrada' })).toBeVisible();
});
