/**
 * Fonte única de verdade para os IDs de perfil, espelhando
 * `src/modules/profile/profile.enum.ts` do backend (troca-aula-backend).
 *
 * Antes desta constante existir, o frontend tinha DOIS mapeamentos
 * divergentes e nenhum dos dois batia com o valor real do backend:
 *   - módulo legado (dashboard):     1=admin,  2=diretor,        3=professor
 *   - módulo master:                 1=master, 2=diretor,        3=administrador, 4=professor
 *   - valor real do backend:         1=DIRETOR, 2=AUXILIAR_ADMIN, 3=PROFESSOR,     4=MASTER
 *
 * Use sempre PROFILE.<NOME> em vez de números mágicos.
 */
export const PROFILE = {
  DIRETOR: 1,
  AUXILIAR_ADMIN: 2,
  PROFESSOR: 3,
  MASTER: 4,
  // Coordenador municipal: gere TODAS as escolas das redes (municípios) que
  // coordena. O backend gera um vínculo sintético por escola no JWT.
  COORDENADOR_MUNICIPAL: 5,
} as const;

export const PROFILE_LABELS: Record<number, string> = {
  [PROFILE.DIRETOR]: 'Diretor',
  [PROFILE.AUXILIAR_ADMIN]: 'Auxiliar administrativo',
  [PROFILE.PROFESSOR]: 'Professor',
  [PROFILE.MASTER]: 'Master',
  [PROFILE.COORDENADOR_MUNICIPAL]: 'Coordenador municipal',
};

export type ProfileId = (typeof PROFILE)[keyof typeof PROFILE];

/** Perfis com alguma capacidade de gestão (tudo que não é professor). */
export const STAFF_PROFILE_IDS: ProfileId[] = [
  PROFILE.MASTER,
  PROFILE.COORDENADOR_MUNICIPAL,
  PROFILE.DIRETOR,
  PROFILE.AUXILIAR_ADMIN,
];

/**
 * Perfis que operam escola a escola na área /escola (diferente do Master,
 * que enxerga tudo). O coordenador entra aqui porque o token traz um
 * vínculo por escola da rede dele.
 */
export const SCHOOL_SCOPED_STAFF_PROFILE_IDS: ProfileId[] = [
  PROFILE.COORDENADOR_MUNICIPAL,
  PROFILE.DIRETOR,
  PROFILE.AUXILIAR_ADMIN,
];

/**
 * Coordenador municipal SEM ser Master: tem algum vínculo de coordenador e
 * nenhum de Master. Usado para mostrar só as telas de rede que ele pode usar.
 */
export function isCoordinatorOnly(
  links?: Array<{ profileId: number }> | null,
): boolean {
  const list = links ?? [];
  return (
    list.some((link) => link.profileId === PROFILE.COORDENADOR_MUNICIPAL) &&
    !list.some((link) => link.profileId === PROFILE.MASTER)
  );
}

/** Telas de /master que o coordenador municipal também usa (na rede dele). */
export const COORDINATOR_MASTER_ROUTES = [
  '/master/escolas',
  '/master/redes',
  '/master/politicas-carga-horaria',
  '/master/auditoria',
];

export function isStaffProfile(profileId?: number | null): boolean {
  return profileId != null && STAFF_PROFILE_IDS.includes(profileId as ProfileId);
}

export function isSchoolScopedStaffProfile(profileId?: number | null): boolean {
  return (
    profileId != null &&
    SCHOOL_SCOPED_STAFF_PROFILE_IDS.includes(profileId as ProfileId)
  );
}
