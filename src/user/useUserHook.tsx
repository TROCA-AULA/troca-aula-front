'use client'
import {useState, useEffect} from 'react';
import {UserData} from "@/user/user.types";
import type { UserContextType } from '@/user/user.types';
import {useRouter} from "next/navigation";


export function useUserHook(): UserContextType {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();


    const fetchUserData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
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
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            setUserData(null);
            router.push('/');

        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    return {
        user: userData,
        isLoading,
        logout,
        refreshUserData: fetchUserData
    };
}
