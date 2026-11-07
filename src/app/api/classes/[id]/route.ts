import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import api from "@/api.service";
import { describeError } from '@/utils/describe-error';

// Defina o tipo dos params como uma Promise
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const cookie = await cookies();
        const tokenCookie = cookie.get('token');

        // AGORA É ASSÍNCRONO: Você precisa dar await no params
        const { id } = await params;

        const body = await req.json();

        const reponse = await api.patch(`/classes/${id}`, body, {
            headers: {
                'Authorization': `Bearer ${tokenCookie?.value}`
            }
        });

        return NextResponse.json(reponse.data, { status: 200 });
    } catch (error) {
        console.error('[classes/[id]]', describeError(error));
        return NextResponse.json(
            { error: 'Ocorreu um erro ao Atualizar as classes.' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const cookie = await cookies();
        const tokenCookie = cookie.get('token');

        // AGORA É ASSÍNCRONO: Você precisa dar await no params
        const { id } = await params;

        const reponse = await api.delete(`/classes/${id}`, {
            headers: {
                'Authorization': `Bearer ${tokenCookie?.value}`
            }
        });

        return NextResponse.json(reponse.data, { status: 200 });
    } catch (error) {
        console.error('[classes/[id]]', describeError(error));
        return NextResponse.json(
            { error: 'Ocorreu um erro ao deletar as classes.' },
            { status: 500 }
        );
    }
}
