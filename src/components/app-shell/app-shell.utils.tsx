import { PROFILE, isCoordinatorOnly, isSchoolScopedStaffProfile } from '@/constants/profile';
import {
  CONTA_ITEMS,
  ESCOLA_ITEMS,
  MASTER_ITEMS,
  PAINEL,
  PROFESSOR_ITEMS,
  REDE_ITEMS,
  TEXT,
  type MenuSection,
} from './app-shell.constants';

interface MenuUser {
  profileId?: number | null;
}

/** Monta o menu lateral conforme o perfil de quem está logado. */
export function buildMenu(
  user: MenuUser | null | undefined,
  schoolLinks?: Array<{ profileId: number }> | null,
): MenuSection[] {
  if (!user) return [];

  const isMaster = user.profileId === PROFILE.MASTER;
  const isCoordinator =
    !isMaster &&
    (user.profileId === PROFILE.COORDENADOR_MUNICIPAL || isCoordinatorOnly(schoolLinks));
  const isProfessor = user.profileId === PROFILE.PROFESSOR;
  const managesSchool = isMaster || isSchoolScopedStaffProfile(user.profileId);

  const sections: MenuSection[] = [{ items: [PAINEL] }];
  if (isProfessor) sections.push({ title: TEXT.sections.professor, items: PROFESSOR_ITEMS });
  if (managesSchool) sections.push({ title: TEXT.sections.escola, items: ESCOLA_ITEMS });
  if (isCoordinator) sections.push({ title: TEXT.sections.rede, items: REDE_ITEMS });
  if (isMaster) sections.push({ title: TEXT.sections.master, items: MASTER_ITEMS });
  sections.push({ title: TEXT.sections.conta, items: CONTA_ITEMS });
  return sections;
}

/** Item ativo: a própria rota ou uma sub-rota dela. */
export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Primeira letra do nome, para o avatar. */
export function initialOf(name?: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || '?';
}
