import { test, expect } from './support/fixtures';
import { Api, SENHA, cadastrar, criarCenario, sufixo } from './support/api';
import { aviso, cartaoAula, entrar, linha, senhaTemporariaDoAviso } from './support/sessao';

// Gestão da escola pela diretora: professores, limite de substituições,
// senha temporária e desvínculo.

test('diretora vincula professor pelo e-mail e define a disciplina', async ({ page, abrirSessao }) => {
  const c = await criarCenario(0);
  const s = sufixo();
  const nome = `Prof. Gil ${s}`;
  const email = `gil.${s}@e2e.local`;
  await cadastrar(nome, email); // sem disciplina
  await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 2);

  await entrar(page, c.diretora.email, undefined, '/escola/professores');
  await page.getByLabel('E-mail do professor').fill(email);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('Disciplina: não informada')).toBeVisible();
  await page.getByRole('button', { name: 'Vincular como professor' }).click();
  await expect(aviso(page, `${nome} agora é professor desta escola`)).toBeVisible();

  const row = linha(page, email);
  await expect(row).toContainText('Não vê vagas até ter disciplina');
  await row.getByLabel(`Disciplina de ${nome}`).selectOption({ label: c.disciplina });
  await row.getByRole('button', { name: `Salvar ${nome}` }).click();
  await expect(aviso(page, `Dados de ${nome} salvos`)).toBeVisible();
  await expect(row).not.toContainText('Não vê vagas até ter disciplina');

  // A disciplina nova vale sem sair e entrar de novo (D23): basta abrir a tela.
  const prof = await abrirSessao(email, undefined, '/classes');
  await expect(cartaoAula(prof, c.disciplina)).toBeVisible();
});

test('buscar e-mail sem cadastro explica o que fazer', async ({ page }) => {
  const c = await criarCenario(0);
  await entrar(page, c.diretora.email, undefined, '/escola/professores');
  await page.getByLabel('E-mail do professor').fill(`ninguem.${sufixo()}@e2e.local`);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('Nenhum cadastro com esse e-mail.')).toBeVisible();
});

test('limite de substituições: ao atingir, o professor não consegue se candidatar', async ({ page, abrirSessao }) => {
  const c = await criarCenario(1);
  const [carla] = c.professores;

  await entrar(page, c.diretora.email, undefined, '/escola/professores');
  const row = linha(page, carla.email);
  await row.getByLabel(`Limite de ${carla.nome}`).fill('1');
  await row.getByRole('button', { name: `Salvar ${carla.nome}` }).click();
  await expect(aviso(page, `Dados de ${carla.nome} salvos`)).toBeVisible();

  // Ela ganha uma substituição (preparado pela API)...
  const aula1 = await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 2);
  const carlaApi = await Api.entrar(carla.email, SENHA);
  const cand = await carlaApi.candidatar(aula1);
  await c.diretoraApi.chamar('PATCH', `/enrollment-requests/${cand}/approve`);
  await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 3);

  // ...e a próxima aparece bloqueada para ela.
  const p = await abrirSessao(carla.email, undefined, '/classes');
  await expect(cartaoAula(p, c.disciplina).getByRole('button', { name: 'Limite atingido' })).toBeDisabled();
});

test('redefinir senha mostra a senha temporária, que funciona no login', async ({ page, abrirSessao }) => {
  const c = await criarCenario(1);
  const [carla] = c.professores;

  await entrar(page, c.diretora.email, undefined, '/escola/professores');
  await linha(page, carla.email).getByRole('button', { name: `Redefinir senha de ${carla.nome}` }).click();
  const temporaria = await senhaTemporariaDoAviso(page);
  await expect(aviso(page, 'o e-mail não foi enviado')).toBeVisible();

  const p = await abrirSessao(carla.email, temporaria);
  await expect(p.getByRole('banner')).toContainText(carla.nome);
});

test('desvincular professor pede confirmação e tira da lista', async ({ page }) => {
  const c = await criarCenario(2);
  const [carla, davi] = c.professores;

  await entrar(page, c.diretora.email, undefined, '/escola/professores');
  await linha(page, carla.email).getByRole('button', { name: `Desvincular ${carla.nome}` }).click();
  const dialogo = page.getByRole('alertdialog');
  await expect(dialogo).toContainText(`${carla.nome} deixa de ser professor desta escola`);
  await dialogo.getByRole('button', { name: 'Desvincular' }).click();

  await expect(aviso(page, `${carla.nome} foi desvinculado da escola`)).toBeVisible();
  await expect(linha(page, carla.email)).toHaveCount(0);
  await expect(linha(page, davi.email)).toBeVisible();
});
