export interface SchoolLink {
    profileId: number;
    schoolId: number;
    approvedAt: string | null;
    /**
     * Rede de ensino da escola (Schools.networkId). Passou a vir no JWT
     * (AuthService.signIn) e é exposta por /api/auth/me nesta rodada —
     * consumida como `activeNetworkId` no SchoolContext.
     */
    networkId: number | null;
}

export interface UserData {
    // Sempre numérico na prática: vem de `sub.id` no JWT (Users.id é serial
    // no banco) — ver src/app/api/auth/me/route.ts. Nunca string.
    id: number;
    name: string;
    email: string;
    /** Perfil no vínculo ativo (ver SchoolContext) — mantido para compatibilidade com código existente. */
    profileId?: number;
    /** Escola do vínculo ativo (ver SchoolContext) — mantido para compatibilidade com código existente. */
    schoolId?: number;
    /** Todos os vínculos escola/perfil do usuário — um usuário pode pertencer a mais de uma escola. */
    schoolLinks?: SchoolLink[];
}


export interface UserContextType {
    user: UserData | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    refreshUserData: () => Promise<void>;
}
