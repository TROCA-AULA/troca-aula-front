import { test, expect } from './support/fixtures';
import { Api, MASTER, PERFIL, cadastrar, sufixo } from './support/api';
import { aviso, entrar, linha, senhaTemporariaDoAviso } from './support/sessao';

// Área Master: cadastros de base (rede, escola, disciplina) e nomeação de
// diretor com senha temporária.

test('MASTER cadastra rede e escola pela tela', async ({ page }) => {
  const s = sufixo();
  const rede = `Município Tela ${s}`;
  const escola = `EMEF Tela ${s}`;

  await entrar(page, MASTER.email, MASTER.senha, '/master/redes');
  await page.getByRole('button', { name: '+ Nova Rede' }).click();
  await page.getByLabel('Nome *').fill(rede);
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(aviso(page, 'Rede criada com sucesso')).toBeVisible();
  await expect(linha(page, rede)).toBeVisible();

  await page.goto('/master/escolas');
  await page.getByRole('button', { name: '+ Nova Escola' }).click();
  await page.getByLabel('Nome *').fill(escola);
  await page.getByLabel('Rede de Ensino *').selectOption({ label: rede });
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(aviso(page, 'Escola criada com sucesso')).toBeVisible();
  await expect(linha(page, escola)).toContainText(rede);
});

test('catálogo de disciplinas: criar, recusar repetida, renomear e remover', async ({ page }) => {
  const s = sufixo();
  const nome = `Química ${s}`;
  const novo = `Química Orgânica ${s}`;

  await entrar(page, MASTER.email, MASTER.senha, '/master/disciplinas');
  await page.getByLabel('Nome da disciplina').fill(nome);
  await page.getByRole('button', { name: 'Criar disciplina' }).click();
  await expect(aviso(page, `Disciplina "${nome}" criada`)).toBeVisible();
  await expect(linha(page, nome)).toBeVisible();

  await page.getByLabel('Nome da disciplina').fill(nome.toUpperCase());
  await page.getByRole('button', { name: 'Criar disciplina' }).click();
  await expect(aviso(page, `Já existe a disciplina "${nome.toUpperCase()}".`)).toBeVisible();

  await page.getByRole('button', { name: `Renomear ${nome}` }).click();
  await page.getByLabel(`Novo nome de ${nome}`).fill(novo);
  await page.getByLabel(`Novo nome de ${nome}`).press('Enter');
  await expect(aviso(page, 'Disciplina renomeada')).toBeVisible();
  await expect(linha(page, novo)).toBeVisible();

  await page.getByRole('button', { name: `Remover ${novo}` }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remover' }).click();
  await expect(aviso(page, `Disciplina "${novo}" removida`)).toBeVisible();
  await expect(linha(page, novo)).toHaveCount(0);

  // Removida some também do cadastro público.
  await page.goto('/cadastro');
  await expect(page.getByLabel('disciplina').locator('option', { hasText: novo })).toHaveCount(0);
});

test('MASTER nomeia diretor; a senha temporária do aviso entra no sistema', async ({ page, abrirSessao }) => {
  const s = sufixo();
  const master = await Api.master();
  const redeId = await master.criarRede(`Município Dir ${s}`);
  const escola = `EMEF Dir ${s}`;
  await master.criarEscola(escola, redeId);
  const nome = `Diretor Hugo ${s}`;
  const email = `hugo.${s}@e2e.local`;

  await entrar(page, MASTER.email, MASTER.senha, '/master/diretores');
  await page.getByRole('button', { name: '+ Novo Diretor' }).click();
  await page.getByLabel('Nome *').fill(nome);
  await page.getByLabel('Email *').fill(email);
  await page.getByLabel('Telefone').fill('16999997777');
  await page.getByLabel('Escola *').selectOption({ label: escola });
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();

  const temporaria = await senhaTemporariaDoAviso(page);
  await expect(linha(page, email)).toContainText(escola);

  const p = await abrirSessao(email, temporaria);
  await expect(p.getByRole('banner')).toContainText(nome);
  await expect(p.locator('input[disabled]')).toHaveValue(escola);
  await expect(p.getByRole('link', { name: 'Professores' })).toBeVisible();
  await expect(p.getByRole('link', { name: 'Área Master' })).toHaveCount(0);
});

test('diretor não entra na Área Master', async ({ page }) => {
  const s = sufixo();
  const master = await Api.master();
  const redeId = await master.criarRede(`Município Bloq ${s}`);
  const escolaId = await master.criarEscola(`EMEF Bloq ${s}`, redeId);
  const id = await cadastrar(`Diretora Bia ${s}`, `bia.${s}@e2e.local`);
  await master.vincular(id, PERFIL.DIRETOR, escolaId);

  await entrar(page, `bia.${s}@e2e.local`, undefined, '/master/redes');
  await expect(page).toHaveURL('/dashboard');
});
