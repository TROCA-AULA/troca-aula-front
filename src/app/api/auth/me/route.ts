import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import axios from 'axios';
import api from '@/api.service';
import { describeError } from '@/utils/describe-error';
import { clearedSessionCookie, sessionCookie } from '../session-cookie';

type Link = {
    profileId: number;
    schoolId: number;
    approvedAt: string | null;
    networkId?: number | null;
};
type TokenUser = {
    id?: number;
    name?: string;
    email?: string;
    subjectId?: number | null;
    residenceNetworkId?: number | null;
    upsUser?: Link[];
};

// Com ?refresh=1, troca antes o token por um novo no backend (D23): a
// disciplina e os vínculos vão dentro do token, e sem renovar só mudavam no
// próximo login. Renovar também estende a validade (D19). O SchoolContext
// pede assim ao abrir o app.
async function renewToken(token: string): Promise<string | 'expired' | null> {
    try {
        const response = await api.post('/auth/refresh', undefined, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.access_token as string;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return 'expired';
        }
        // Backend fora do ar: segue com o token atual.
        return null;
    }
}

function unauthorized(message: string, clearCookie = false) {
    const res = NextResponse.json({ error: message }, { status: 401 });
    if (clearCookie) res.headers.set('Set-Cookie', clearedSessionCookie());
    return res;
}

export async function GET(req: NextRequest) {
    try {
        const cookie = await cookies();
        let token = cookie.get('token')?.value;

        if (!token) {
            return unauthorized('Não autenticado');
        }

        let renewed = false;
        if (req.nextUrl?.searchParams.get('refresh') === '1') {
            const fresh = await renewToken(token);
            if (fresh === 'expired') return unauthorized('Sessão expirada', true);
            if (fresh) {
                token = fresh;
                renewed = true;
            }
        }

        const secret = new TextEncoder().encode(process?.env?.SECRET ?? 's0//P4$$w0rD');
        const { payload } = await jwtVerify(token, secret);
        const sub = payload?.sub as TokenUser | undefined;
        const upsUser = sub?.upsUser ?? [];

        // Vínculo "ativo": prioriza vínculos já aprovados; cai para o primeiro se nenhum foi aprovado ainda.
        const approved = upsUser.filter((u) => u?.approvedAt);
        const activeLink = approved[0] ?? upsUser[0];

        const res = NextResponse.json({
            id: sub?.id,
            name: sub?.name,
            email: sub?.email,
            subjectId: sub?.subjectId ?? null,
            residenceNetworkId: sub?.residenceNetworkId ?? null,
            profileId: activeLink?.profileId,
            schoolId: activeLink?.schoolId,
            // Todos os vínculos escola/perfil do usuário (pode ter mais de um) —
            // usado pelo SchoolContext para o seletor de escola ativa.
            schoolLinks: upsUser.map((u) => ({
                profileId: u.profileId,
                schoolId: u.schoolId,
                approvedAt: u.approvedAt ?? null,
                networkId: u.networkId ?? null,
            })),
        });
        if (renewed) res.headers.set('Set-Cookie', sessionCookie(token));
        return res;
    } catch (error) {
        console.error('[auth/me]', describeError(error));
        return unauthorized('Token inválido', true);
    }
}
