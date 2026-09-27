import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import api from '@/api.service';

// Proxy genérico server-side para o backend. Existe porque o cookie de
// sessão é httpOnly (proteção contra roubo de token via XSS) — o JS do
// navegador nunca consegue lê-lo via document.cookie (ver
// src/api-client.service.tsx). Route Handlers do Next.js rodam no servidor
// e conseguem ler cookies httpOnly via next/headers, então a autenticação
// "acontece" aqui, um hop antes do backend real — mesmo padrão já usado em
// src/app/api/classes/route.ts, generalizado para qualquer endpoint.
type RouteParams = { params: Promise<{ path: string[] }> };

async function forward(req: NextRequest, params: RouteParams['params']) {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const url = `/${path.join('/')}${req.nextUrl.search}`;

  let data: unknown;
  if (!['GET', 'HEAD'].includes(req.method)) {
    const text = await req.text();
    data = text ? JSON.parse(text) : undefined;
  }

  try {
    const response = await api.request({
      url,
      method: req.method,
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    console.error(error);
    return NextResponse.json({ error: 'Erro ao comunicar com o backend.' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  return forward(req, params);
}
export async function POST(req: NextRequest, { params }: RouteParams) {
  return forward(req, params);
}
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return forward(req, params);
}
export async function PUT(req: NextRequest, { params }: RouteParams) {
  return forward(req, params);
}
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return forward(req, params);
}
