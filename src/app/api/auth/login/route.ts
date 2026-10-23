import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import api from '@/api.service';
import { describeError } from '@/utils/describe-error';
import { sessionCookie } from '../session-cookie';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  try {
    const response = await api.post('/auth/login', { email, password });
    const { access_token: token } = response.data;

    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', sessionCookie(token));
    return res;
  } catch (e) {
    // O backend respondeu e recusou (senha errada, dados inválidos): o
    // interceptor do api.service já registrou o status.
    const status = axios.isAxiosError(e) ? e.response?.status : undefined;
    if (status !== undefined && status < 500) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }
    // Backend fora do ar ou com erro interno: não é culpa de quem digitou.
    console.error('[auth/login]', describeError(e));
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 });
  }
}
