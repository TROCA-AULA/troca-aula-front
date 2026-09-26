import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { jwtVerify } from 'jose';

// Mesma chave/fallback usada em src/app/api/auth/me/route.ts — precisa
// continuar em sincronia com o SECRET do backend (troca-aula-backend/.env).
const secret = new TextEncoder().encode(process?.env?.SECRET ?? 's0//P4$$w0rD');

// Renomeado de `middleware` para `proxy` (Next.js 16 — o nome/arquivo
// `middleware` foi descontinuado). O runtime deixou de ser configurável
// como Edge (proxy roda sempre em Node.js no Next 16); `jose` funciona
// igual nos dois runtimes, então a validação do JWT abaixo não muda.
export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const publicPaths = ['/', '/cadastro', '/api/login', '/api/auth/me', '/api/auth/logout', '/api/classes'];

    if (publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    const cookie = req.headers.get('cookie') || '';
    const { token } = parse(cookie);

    if (!token) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    try {
        // Valida assinatura e expiração do JWT. Antes desta correção (P6),
        // o middleware só checava a presença do cookie, deixando passar
        // tokens adulterados/expirados até serem barrados em /api/auth/me.
        await jwtVerify(token, secret);
    } catch {
        const res = NextResponse.redirect(new URL('/', req.url));
        // Cookie inválido/expirado não serve mais — limpa para evitar
        // loop de redirecionamento com um token que nunca vai passar.
        res.cookies.delete('token');
        return res;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|images|api|api/.*).*)',
    ],
};
