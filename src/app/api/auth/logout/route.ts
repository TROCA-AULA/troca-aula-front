import { NextResponse } from 'next/server';
import { clearedSessionCookie } from '../session-cookie';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearedSessionCookie());
  return res;
}
