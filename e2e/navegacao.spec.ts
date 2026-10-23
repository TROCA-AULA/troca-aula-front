import type { Page } from '@playwright/test';
import { test, expect } from './support/fixtures';
import { criarCenario } from './support/api';
import { entrar } from './support/sessao';

// Toda tela logada fica dentro da mesma moldura: menu lateral (conforme o
// perfil) e cabeçalho com quem está logado e "Sair". Antes, as telas do
// professor e a troca de senha apareciam soltas, sem menu.

async function navegaPeloMenu(page: Page, nome: string, telas: Array<[string, string, string]>) {
  const menu = page.getByRole('navigation', { name: 'Menu principal' });
  for (const [link, url, titulo] of telas) {
    await menu.getByRole('link', { name: link, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { name: titulo }).first()).toBeVisible();
    await expect(menu.getByRole('link', { name: link, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('banner')).toContainText(nome);
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  }
}

test('professor navega por todas as suas telas pelo menu', async ({ page }) => {
  const c = await criarCenario(1);
  const [carla] = c.professores;
  await entrar(page, carla.email);

  const menu = page.getByRole('navigation', { name: 'Menu principal' });
  await expect(menu.getByRole('link', { name: 'Área Master' })).toHaveCount(0);
  await expect(menu.getByRole('link', { name: 'Jornada docente' })).toHaveCount(0);

  await navegaPeloMenu(page, carla.nome, [
    ['Aulas disponíveis', '/classes', 'Aulas Disponíveis'],
    ['Minhas candidaturas', '/minhas-aulas', 'Minhas Aulas'],
    ['Minha jornada', '/minha-jornada', 'Minha Jornada Docente'],
    ['Minhas preferências', '/minhas-preferencias', 'Minhas preferências de vagas'],
    ['Alterar senha', '/alterar-senha', 'Alterar senha'],
  ]);
});

test('diretora navega pela gestão da escola pelo menu', async ({ page }) => {
  const c = await criarCenario(0);
  await entrar(page, c.diretora.email);

  await navegaPeloMenu(page, c.diretora.nome, [
    ['Professores', '/escola/professores', 'Professores da escola'],
    ['Jornada docente', '/escola/jornada-docente', 'Jornada Docente'],
    ['Prioridade de vagas', '/escola/prioridade', 'Prioridade de vagas'],
    ['Alterar senha', '/alterar-senha', 'Alterar senha'],
  ]);

  // "Painel" volta para o painel, ainda com a moldura.
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Painel' }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('button', { name: 'Aulas aceitas' })).toBeVisible();
});

test('no celular o menu abre como gaveta', async ({ page }) => {
  const c = await criarCenario(1);
  await page.setViewportSize({ width: 390, height: 800 });
  await entrar(page, c.professores[0].email, undefined, '/classes');

  const menu = page.getByRole('navigation', { name: 'Menu principal' });
  await expect(menu).not.toBeInViewport();

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(menu).toBeInViewport();
  await menu.getByRole('link', { name: 'Minha jornada' }).click();

  await expect(page).toHaveURL('/minha-jornada');
  await expect(menu).not.toBeInViewport();
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
});
