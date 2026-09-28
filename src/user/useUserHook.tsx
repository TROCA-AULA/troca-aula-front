'use client'
import { useSchoolContext } from '@/contexts/SchoolContext';
import type { UserContextType } from '@/user/user.types';

/**
 * @deprecated Use `useSchoolContext()` diretamente. Desde a Fase 3 o
 * SchoolContext é a fonte única de sessão (busca `/api/auth/me` uma única
 * vez e ainda expõe escola/perfil ativos); este wrapper existe apenas para
 * compatibilidade de assinatura (`UserContextType`) com código antigo e
 * será removido quando não houver mais consumidores. Não havia mais nenhum
 * uso real no código — a unificação de fato (roadmap) é esta delegação.
 *
 * O `useGovbrAuth` continua existindo à parte por ser o fluxo de LOGIN
 * Gov.br (OAuth), não uma segunda fonte de sessão: ele grava o cookie pela
 * mesma rota (`/api/auth/govbr-session`) e o SchoolContext lê dali.
 */
export function useUserHook(): UserContextType {
    const { user, isLoading, logout, refreshUserData } = useSchoolContext();
    return { user, isLoading, logout, refreshUserData };
}
