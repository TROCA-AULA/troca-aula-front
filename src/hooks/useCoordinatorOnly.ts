'use client';

import { useOptionalSchoolContext } from '@/contexts/SchoolContext';
import { isCoordinatorOnly } from '@/constants/profile';

/**
 * true quando quem está logado é coordenador municipal (e não Master).
 * Telas compartilhadas com o Master usam isto para esconder ações que só o
 * Master pode fazer (o backend recusa de qualquer jeito). Fora do
 * <SchoolProvider> devolve false.
 */
export function useCoordinatorOnly(): boolean {
  const context = useOptionalSchoolContext();
  return isCoordinatorOnly(context?.schoolLinks);
}
