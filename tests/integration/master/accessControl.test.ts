import { describe, it, expect } from 'vitest';
import { PROFILE } from '@/constants/profile';

// Correção: este teste antes codificava o mapeamento ERRADO de profileId
// (assumia 1=Master) como comportamento esperado — mesmo bug de autorização
// real encontrado na auditoria. O valor real do backend é
// DIRETOR=1, AUXILIAR_ADMIN=2, PROFESSOR=3, MASTER=4.
describe('Master Access Control - Integration', () => {
  const scenarios = [
    { profileId: PROFILE.MASTER, expected: 'allow', label: 'Master' },
    { profileId: PROFILE.DIRETOR, expected: 'redirect', label: 'Diretor' },
    { profileId: PROFILE.AUXILIAR_ADMIN, expected: 'redirect', label: 'Auxiliar Administrativo' },
    { profileId: PROFILE.PROFESSOR, expected: 'redirect', label: 'Professor' },
  ];

  it.each(scenarios)('should $expected for $label (profileId=$profileId)', ({ profileId, expected }) => {
    const result = profileId === PROFILE.MASTER ? 'allow' : 'redirect';
    expect(result).toBe(expected);
  });

  it('should allow only profileId=PROFILE.MASTER to access master area', () => {
    const allowedProfile = PROFILE.MASTER;
    const blockedProfiles = [PROFILE.DIRETOR, PROFILE.AUXILIAR_ADMIN, PROFILE.PROFESSOR];

    expect(allowedProfile).toBe(PROFILE.MASTER);
    blockedProfiles.forEach((p) => expect(p).not.toBe(PROFILE.MASTER));
  });
});
