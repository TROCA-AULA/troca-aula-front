import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import api from "@/api.service";

export async function GET(req: NextRequest) {
    try {
        const cookie = await cookies();

        const tokenCookie = cookie.get('token');      // retorna { value, name, ... } ou undefined
        const searchParams = req.nextUrl.searchParams;
        const params: Record<string, string> = {};
        for (const [key, value] of searchParams.entries()) {
            params[key] = value;
        }
        const config = {
            params, headers: {
                'Authorization': `Bearer ${tokenCookie?.value}`
            }
        }
        const reponse = await api.get('/classes', config)
        return NextResponse.json(reponse.data, {status: 200});
    } catch (error) {
        console.error(error); // Para log, nunca envie detalhes completos para o cliente
        return NextResponse.json(
            {error: 'Ocorreu um erro ao buscar as classes.'},
            {status: 500}
        );

    }
}
