import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

// Equivalente ao /api/auth/login para o fluxo Gov.br: recebe o JWT interno
// (já emitido pelo backend após o POST /auth/login-govbr) e o grava como
// cookie httpOnly, com a MESMA configuração usada no login tradicional.
// Antes desta rota, o token Gov.br era gravado direto em localStorage pelo
// cliente (useGovbrAuth), o que o middleware/demais rotas não reconheciam
// como sessão válida (achado P2).
export async function POST(req: NextRequest) {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
        return NextResponse.json({ error: 'Token ausente' }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });

    const maxAge = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + maxAge);

    res.headers.set(
        'Set-Cookie',
        serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'strict',
            expires: expiresAt,
            maxAge: maxAge,
        })
    );

    return res;
}
