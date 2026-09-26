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
} as const;

export type ProfileId = (typeof PROFILE)[keyof typeof PROFILE];

/** Perfis com alguma capacidade de gestão (tudo que não é professor). */
export const STAFF_PROFILE_IDS: ProfileId[] = [
  PROFILE.MASTER,
  PROFILE.DIRETOR,
  PROFILE.AUXILIAR_ADMIN,
];

/** Perfis com escopo em UMA escola (diferente do Master, que enxerga todas). */
export const SCHOOL_SCOPED_STAFF_PROFILE_IDS: ProfileId[] = [
  PROFILE.DIRETOR,
  PROFILE.AUXILIAR_ADMIN,
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
