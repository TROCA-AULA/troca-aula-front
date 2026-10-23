import { describe, it, expect } from 'vitest';
import { PROFILE } from '@/constants/profile';
import { buildMenu, initialOf, isActiveRoute } from './app-shell.utils';

const titles = (user: { profileId: number } | null, links?: Array<{ profileId: number }>) =>
  buildMenu(user, links).map((section) => section.title ?? '(sem título)');

const hrefs = (user: { profileId: number }, links?: Array<{ profileId: number }>) =>
  buildMenu(user, links).flatMap((section) => section.items.map((item) => item.href));

describe('buildMenu', () => {
  it('sem usuário não monta menu', () => {
    expect(buildMenu(null)).toEqual([]);
  });

  it('professor vê as próprias telas e a conta', () => {
    expect(titles({ profileId: PROFILE.PROFESSOR })).toEqual(['(sem título)', 'Minhas aulas', 'Conta']);
    expect(hrefs({ profileId: PROFILE.PROFESSOR })).toEqual([
      '/dashboard',
      '/classes',
      '/minhas-aulas',
      '/minha-jornada',
      '/minhas-preferencias',
      '/alterar-senha',
    ]);
  });

  it('diretor e auxiliar veem a gestão da escola', () => {
    for (const profileId of [PROFILE.DIRETOR, PROFILE.AUXILIAR_ADMIN]) {
      expect(titles({ profileId })).toEqual(['(sem título)', 'Escola', 'Conta']);
      expect(hrefs({ profileId })).toContain('/escola/prioridade');
      expect(hrefs({ profileId })).not.toContain('/master/dashboard');
    }
  });

  it('coordenador vê a escola e só as telas de rede', () => {
    const menu = hrefs({ profileId: PROFILE.COORDENADOR_MUNICIPAL });
    expect(titles({ profileId: PROFILE.COORDENADOR_MUNICIPAL })).toEqual([
      '(sem título)',
      'Escola',
      'Rede (município)',
      'Conta',
    ]);
    expect(menu).toContain('/master/escolas');
    expect(menu).toContain('/master/auditoria');
    expect(menu).not.toContain('/master/coordenadores');
  });

  it('reconhece o coordenador pelos vínculos mesmo com outro perfil ativo', () => {
    const links = [{ profileId: PROFILE.COORDENADOR_MUNICIPAL }];
    expect(titles({ profileId: PROFILE.DIRETOR }, links)).toContain('Rede (município)');
  });

  it('MASTER vê escola e administração, sem a seção de rede', () => {
    const links = [{ profileId: PROFILE.MASTER }, { profileId: PROFILE.COORDENADOR_MUNICIPAL }];
    expect(titles({ profileId: PROFILE.MASTER }, links)).toEqual([
      '(sem título)',
      'Escola',
      'Administração',
      'Conta',
    ]);
    expect(hrefs({ profileId: PROFILE.MASTER })).toContain('/master/coordenadores');
  });
});

describe('isActiveRoute', () => {
  it('casa a rota exata e as sub-rotas', () => {
    expect(isActiveRoute('/master/escolas', '/master/escolas')).toBe(true);
    expect(isActiveRoute('/master/escolas/3', '/master/escolas')).toBe(true);
  });

  it('não confunde rotas com o mesmo começo', () => {
    expect(isActiveRoute('/master/dashboard', '/dashboard')).toBe(false);
    expect(isActiveRoute('/escola/professores-extra', '/escola/professores')).toBe(false);
  });
});

describe('initialOf', () => {
  it('pega a primeira letra em maiúscula', () => {
    expect(initialOf('  ana')).toBe('A');
  });

  it('usa "?" sem nome', () => {
    expect(initialOf('')).toBe('?');
    expect(initialOf(undefined)).toBe('?');
  });
});
