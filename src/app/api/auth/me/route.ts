import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
    try {
        const cookie = await cookies();

        const tokenCookie = cookie.get('token');      // retorna { value, name, ... } ou undefined

        if (!tokenCookie) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }


        const secret = new TextEncoder().encode(process?.env?.SECRET ?? 's0//P4$$w0rD');

        const { payload } = await jwtVerify(tokenCookie.value, secret);
        const sub = payload?.sub as
            | { id?: number; name?: string; email?: string; upsUser?: Array<{ profileId: number; schoolId: number; approvedAt: string | null; networkId?: number | null }> }
            | undefined;
        const upsUser = sub?.upsUser ?? [];

        // Vínculo "ativo": prioriza vínculos já aprovados; cai para o primeiro se nenhum foi aprovado ainda.
        const approved = upsUser.filter((u) => u?.approvedAt);
        const activeLink = approved[0] ?? upsUser[0];

        return NextResponse.json({
            id: sub?.id,
            name: sub?.name,
            email: sub?.email,
            profileId: activeLink?.profileId,
            schoolId: activeLink?.schoolId,
            // Todos os vínculos escola/perfil do usuário (pode ter mais de um) —
            // usado pelo SchoolContext para o seletor de escola ativa.
            schoolLinks: upsUser.map((u) => ({
                profileId: u.profileId,
                schoolId: u.schoolId,
                approvedAt: u.approvedAt ?? null,
                // Vem do JWT (AuthService.signIn). Tokens emitidos antes
                // desta rodada não têm o campo — cai para null até relogar.
                networkId: u.networkId ?? null,
            })),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
}
