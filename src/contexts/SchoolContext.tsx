'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { SchoolLink, UserContextType, UserData } from '@/user/user.types';

const ACTIVE_SCHOOL_STORAGE_KEY = 'troca-aula:activeSchoolId';

interface SchoolContextValue extends UserContextType {
    /** Todos os vínculos escola/perfil do usuário logado. */
    schoolLinks: SchoolLink[];
    /** Escola em que o usuário está operando agora (pode trocar via setActiveSchoolId). */
    activeSchoolId: number | null;
    /** Perfil do usuário NA escola ativa (pode variar por escola). */
    activeProfileId: number | null;
    /** Troca a escola ativa — só aceita um schoolId presente em schoolLinks. */
    setActiveSchoolId: (schoolId: number) => void;
}

const SchoolContext = createContext<SchoolContextValue | undefined>(undefined);

function readStoredSchoolId(): number | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(ACTIVE_SCHOOL_STORAGE_KEY);
        const parsed = raw ? Number(raw) : NaN;
        return Number.isFinite(parsed) ? parsed : null;
    } catch {
        // localStorage pode não estar disponível (modo privado, etc.) — não é fatal.
        return null;
    }
}

function writeStoredSchoolId(schoolId: number) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(ACTIVE_SCHOOL_STORAGE_KEY, String(schoolId));
    } catch {
        // ignora — preferência de "última escola" é conveniência, não requisito.
    }
}

export function SchoolProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
    const router = useRouter();

    const fetchUserData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/auth/me', { credentials: 'include' });
            if (response.ok) {
                const data: UserData = await response.json();
                setUserData(data);
            } else {
                setUserData(null);
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            setUserData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const schoolLinks = useMemo<SchoolLink[]>(
        () => userData?.schoolLinks ?? [],
        [userData],
    );

    // Resolve a escola ativa sempre que os vínculos do usuário mudam: respeita a
    // preferência salva em localStorage se ela ainda for um vínculo válido do
    // usuário; senão cai para o primeiro vínculo (aprovado, se houver algum).
    useEffect(() => {
        if (schoolLinks.length === 0) {
            setSelectedSchoolId(null);
            return;
        }
        const stored = readStoredSchoolId();
        const storedIsValid = stored != null && schoolLinks.some((l) => l.schoolId === stored);
        if (storedIsValid) {
            setSelectedSchoolId(stored);
            return;
        }
        const approved = schoolLinks.find((l) => l.approvedAt);
        setSelectedSchoolId((approved ?? schoolLinks[0]).schoolId);
    }, [schoolLinks]);

    const setActiveSchoolId = useCallback(
        (schoolId: number) => {
            if (!schoolLinks.some((l) => l.schoolId === schoolId)) {
                console.warn(`Tentativa de ativar escola ${schoolId} fora dos vínculos do usuário.`);
                return;
            }
            setSelectedSchoolId(schoolId);
            writeStoredSchoolId(schoolId);
        },
        [schoolLinks],
    );

    const activeProfileId = useMemo(() => {
        if (selectedSchoolId == null) return userData?.profileId ?? null;
        const link = schoolLinks.find((l) => l.schoolId === selectedSchoolId);
        return link?.profileId ?? userData?.profileId ?? null;
    }, [schoolLinks, selectedSchoolId, userData]);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            setUserData(null);
            setSelectedSchoolId(null);
            router.push('/');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }, [router]);

    // Compatibilidade com código existente que lê user.profileId/user.schoolId
    // diretamente (equivalentes ao vínculo ativo).
    const user = useMemo<UserData | null>(() => {
        if (!userData) return null;
        return {
            ...userData,
            profileId: activeProfileId ?? userData.profileId,
            schoolId: selectedSchoolId ?? userData.schoolId,
        };
    }, [userData, activeProfileId, selectedSchoolId]);

    const value: SchoolContextValue = {
        user,
        isLoading,
        logout,
        refreshUserData: fetchUserData,
        schoolLinks,
        activeSchoolId: selectedSchoolId,
        activeProfileId,
        setActiveSchoolId,
    };

    return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

/**
 * Substitui `useUserHook()` em componentes que precisam saber em qual escola
 * o usuário está operando agora (não só qual é o usuário). Precisa estar
 * dentro de <SchoolProvider>, montado no layout raiz.
 */
export function useSchoolContext(): SchoolContextValue {
    const ctx = useContext(SchoolContext);
    if (!ctx) {
        throw new Error('useSchoolContext precisa ser usado dentro de <SchoolProvider>.');
    }
    return ctx;
}
