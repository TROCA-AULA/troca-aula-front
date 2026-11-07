import { COORDINATOR_MASTER_ROUTES } from '@/constants/profile';

export interface MenuItem {
  label: string;
  href: string;
}

export interface MenuSection {
  /** Título pequeno acima dos itens; a primeira seção não tem. */
  title?: string;
  items: MenuItem[];
}

/** Abaixo desta largura o menu lateral vira gaveta (abre pelo botão ☰). */
export const MOBILE_BREAKPOINT = '900px';

export const MENU_ID = 'app-menu';

export const TEXT = {
  brandFirst: 'Troca',
  brandSecond: 'Aula',
  menuLabel: 'Menu principal',
  openMenu: 'Abrir menu',
  closeMenu: 'Fechar menu',
  logout: 'Sair',
  sections: {
    professor: 'Minhas aulas',
    escola: 'Escola',
    rede: 'Rede (município)',
    master: 'Administração',
    conta: 'Conta',
  },
} as const;

export const PAINEL: MenuItem = { label: 'Painel', href: '/dashboard' };

export const PROFESSOR_ITEMS: MenuItem[] = [
  { label: 'Aulas disponíveis', href: '/classes' },
  { label: 'Minhas candidaturas', href: '/minhas-aulas' },
  { label: 'Minha jornada', href: '/minha-jornada' },
  { label: 'Minhas preferências', href: '/minhas-preferencias' },
];

export const ESCOLA_ITEMS: MenuItem[] = [
  { label: 'Professores', href: '/escola/professores' },
  { label: 'Jornada docente', href: '/escola/jornada-docente' },
  { label: 'Fechamento de ponto', href: '/escola/fechamento-ponto' },
  { label: 'Indicadores', href: '/escola/indicadores' },
  { label: 'Prioridade de vagas', href: '/escola/prioridade' },
];

export const MASTER_ITEMS: MenuItem[] = [
  { label: 'Área Master', href: '/master/dashboard' },
  { label: 'Redes de ensino', href: '/master/redes' },
  { label: 'Escolas', href: '/master/escolas' },
  { label: 'Políticas de carga horária', href: '/master/politicas-carga-horaria' },
  { label: 'Disciplinas', href: '/master/disciplinas' },
  { label: 'Coordenadores', href: '/master/coordenadores' },
  { label: 'Diretores', href: '/master/diretores' },
  { label: 'Administradores', href: '/master/administradores' },
  { label: 'Professores', href: '/master/professores' },
  { label: 'Auditoria', href: '/master/auditoria' },
];

/** O coordenador municipal usa só as telas de rede do Master. */
export const REDE_ITEMS: MenuItem[] = MASTER_ITEMS.filter((item) =>
  COORDINATOR_MASTER_ROUTES.includes(item.href),
);

export const CONTA_ITEMS: MenuItem[] = [{ label: 'Alterar senha', href: '/alterar-senha' }];
