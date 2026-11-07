import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';
import { Api, MASTER, SENHA, cadastrar, sufixo } from './support/api';
import { aviso, entrar } from './support/sessao';

// Login, cadastro, troca de senha e sessão — pela tela, contra o backend real.

test('login com senha errada avisa e continua na tela de entrada', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('e-mail').fill(MASTER.email);
  await page.getByPlaceholder('senha').fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(aviso(page, 'Erro ao fazer login')).toBeVisible();
  await expect(page).toHaveURL('/');
});

test('login pelo formulário leva ao painel; "Sair" volta para a entrada', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('e-mail').fill(MASTER.email);
  await page.getByPlaceholder('senha').fill(MASTER.senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('banner')).toContainText('Administrador Master');
  await expect(page.getByRole('link', { name: 'Área Master' })).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL('/');
  // Sem sessão, a área logada manda de volta para a entrada.
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/');
});

test('sem login, as telas internas redirecionam para a entrada', async ({ page }) => {
  for (const rota of ['/dashboard', '/master', '/escola/professores', '/minhas-aulas']) {
    await page.goto(rota);
    await expect(page, rota).toHaveURL('/');
  }
});

test('sessão vencida (D19): token expirado no cookie manda para a entrada', async ({ page, context, baseURL }) => {
  const secret = new TextEncoder().encode(process.env.E2E_SECRET ?? 'e2e-secret');
  const vencido = await new SignJWT({ sub: '1' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(secret);
  await context.addCookies([{ name: 'token', value: vencido, url: baseURL! }]);

  await page.goto('/dashboard');
  await expect(page).toHaveURL('/');
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === 'token')?.value ?? '').toBe('');
});

test('cadastro de professor pela tela e primeiro login', async ({ page }) => {
  const s = sufixo();
  const master = await Api.master();
  const disciplina = `Geografia ${s}`;
  await master.criarDisciplina(disciplina);
  const email = `novo.${s}@e2e.local`;

  await page.goto('/cadastro');
  await page.getByPlaceholder('nome').fill(`Prof. Novo ${s}`);
  await page.getByPlaceholder('e-mail').fill(email);
  await page.getByPlaceholder('telefone').fill('16999998888');
  await page.getByLabel('disciplina').selectOption({ label: disciplina });
  await page.getByPlaceholder('senha (mínimo 8 caracteres)').fill(SENHA);
  await page.getByPlaceholder('confirme a senha').fill(SENHA);
  await page.getByRole('button', { name: 'Cadastrar' }).click();

  await expect(aviso(page, 'Usuário cadastrado com sucesso')).toBeVisible();
  await expect(page).toHaveURL('/');

  await page.getByPlaceholder('e-mail').fill(email);
  await page.getByPlaceholder('senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('banner')).toContainText(`Prof. Novo ${s}`);
});

test('cadastro com e-mail repetido mostra o erro do servidor', async ({ page }) => {
  const s = sufixo();
  const email = `repetido.${s}@e2e.local`;
  await cadastrar(`Pessoa ${s}`, email);

  await page.goto('/cadastro');
  await page.getByPlaceholder('nome').fill(`Outra ${s}`);
  await page.getByPlaceholder('e-mail').fill(email);
  await page.getByPlaceholder('telefone').fill('16999998888');
  await page.getByPlaceholder('senha (mínimo 8 caracteres)').fill(SENHA);
  await page.getByPlaceholder('confirme a senha').fill(SENHA);
  await page.getByRole('button', { name: 'Cadastrar' }).click();

  await expect(aviso(page, 'E-mail já cadastrado')).toBeVisible();
  await expect(page).toHaveURL('/cadastro');
});

test('troca de senha: a nova vale no login e a antiga deixa de valer', async ({ page }) => {
  const s = sufixo();
  const email = `senha.${s}@e2e.local`;
  await cadastrar(`Pessoa Senha ${s}`, email);
  const nova = 'NovaSenha@2026';

  await entrar(page, email, SENHA, '/alterar-senha');
  await page.getByLabel('Senha atual').fill(SENHA);
  await page.getByLabel('Nova senha', { exact: true }).fill(nova);
  await page.getByLabel('Confirmar nova senha').fill(nova);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();

  await expect(aviso(page, 'Senha alterada com sucesso')).toBeVisible();
  await expect(page).toHaveURL('/dashboard');

  const antiga = await page.request.post('/api/auth/login', { data: { email, password: SENHA } });
  expect(antiga.status()).toBe(401);
  const comNova = await page.request.post('/api/auth/login', { data: { email, password: nova } });
  expect(comNova.ok()).toBeTruthy();
});
