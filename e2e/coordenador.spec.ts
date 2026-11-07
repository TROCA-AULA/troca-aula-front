import { test, expect } from './support/fixtures';
import { Api, MASTER, SENHA, cadastrar, criarCenario } from './support/api';
import { aviso, entrar, linha, senhaTemporariaDoAviso } from './support/sessao';

// Coordenador municipal: nomeado pelo MASTER, gere todas as escolas do
// município (cria escola, aprova candidaturas de qualquer uma delas).

test('MASTER nomeia coordenador; ele cria escola e aprova candidatura no município', async ({ page, abrirSessao }) => {
  const c = await criarCenario(1);
  const [carla] = c.professores;
  const outraEscola = `EMEF Beta ${c.s}`;
  await c.master.criarEscola(outraEscola, c.redeId);
  const aula = await c.diretoraApi.criarAula(c.escolaId, c.disciplinaId, c.diretora.id, 2);
  await (await Api.entrar(carla.email, SENHA)).candidatar(aula);

  // 1. MASTER nomeia pela tela; a conta é criada com senha temporária.
  const nome = `Coord. Lia ${c.s}`;
  const email = `lia.${c.s}@e2e.local`;
  await entrar(page, MASTER.email, MASTER.senha, '/master/coordenadores');
  await page.getByLabel('Nome').fill(nome);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Telefone').fill('16999996666');
  await page.getByLabel('Rede (município)').selectOption({ label: c.rede });
  await page.getByRole('button', { name: 'Nomear coordenador' }).click();
  const temporaria = await senhaTemporariaDoAviso(page);
  await expect(linha(page, email)).toContainText(c.rede);

  // 2. Coordenadora entra e chega à gestão do município.
  const p = await abrirSessao(email, temporaria);
  const menu = p.getByRole('navigation', { name: 'Menu principal' });
  await expect(menu.getByText('Rede (município)')).toBeVisible();
  await menu.getByRole('link', { name: 'Escolas', exact: true }).click();
  await expect(p).toHaveURL('/master/escolas');
  await expect(linha(p, c.escola)).toBeVisible();
  await expect(linha(p, outraEscola)).toBeVisible();

  // 3. Cria uma escola nova; só o município dela aparece para escolher.
  const nova = `EMEF Gama ${c.s}`;
  await p.getByRole('button', { name: '+ Nova Escola' }).click();
  const redes = p.getByLabel('Rede de Ensino *').locator('option');
  await expect(redes).toHaveCount(2); // "Selecione..." + o município dela
  await p.getByLabel('Rede de Ensino *').selectOption({ label: c.rede });
  await p.getByLabel('Nome *').fill(nova);
  await p.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(aviso(p, 'Escola criada com sucesso')).toBeVisible();
  await expect(linha(p, nova)).toBeVisible();
  // Excluir escola é só do MASTER.
  await expect(linha(p, nova).getByRole('button', { name: 'Excluir' })).toHaveCount(0);

  // 4. No painel, escolhe a escola e aprova a candidatura da Carla.
  await p.goto('/dashboard');
  const seletor = p.getByLabel('Escola ativa');
  await expect(seletor.locator('option', { hasText: c.escola })).toHaveCount(1);
  await seletor.selectOption({ label: c.escola });
  await p.getByRole('button', { name: 'Candidaturas' }).click();
  await linha(p, carla.nome).getByRole('button', { name: 'Aprovar' }).click();
  await expect(aviso(p, 'Candidatura aprovada com sucesso!')).toBeVisible();
});

test('coordenador não vê escolas de outro município', async ({ abrirSessao }) => {
  const a = await criarCenario(0);
  const b = await criarCenario(0);
  const email = `coord.${a.s}@e2e.local`;
  const id = await cadastrar(`Coord. Rui ${a.s}`, email);
  await a.master.chamar('POST', '/network-coordinators', { userId: id, networkId: a.redeId });

  const p = await abrirSessao(email, SENHA, '/master/escolas');
  await expect(linha(p, a.escola)).toBeVisible();
  await expect(linha(p, b.escola)).toHaveCount(0);
});
