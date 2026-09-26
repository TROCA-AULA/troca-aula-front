import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from './middleware';
import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { jwtVerify } from 'jose';

vi.mock('next/server', () => ({
    NextResponse: {
        next: vi.fn(),
        redirect: vi.fn(),
    },
}));

vi.mock('cookie', () => ({
    parse: vi.fn(),
}));

vi.mock('jose', () => ({
    jwtVerify: vi.fn(),
}));

describe('Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (NextResponse.redirect as any).mockReturnValue({
            cookies: { delete: vi.fn() },
        });
    });

    const createRequest = (pathname: string, cookieHeader = '') => {
        return {
            nextUrl: { pathname },
            headers: {
                get: vi.fn().mockReturnValue(cookieHeader),
            },
            url: `http://localhost${pathname}`,
        } as unknown as NextRequest;
    };

    it('allows public paths', async () => {
        const req = createRequest('/');
        await middleware(req);
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows /cadastro', async () => {
        const req = createRequest('/cadastro');
        await middleware(req);
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('redirects to / if token is missing on private path', async () => {
        const req = createRequest('/dashboard');
        (parse as any).mockReturnValue({});

        await middleware(req);

        expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/', 'http://localhost/dashboard'));
    });

    it('allows access if token is present and valid', async () => {
        const req = createRequest('/dashboard', 'token=valid');
        (parse as any).mockReturnValue({ token: 'valid' });
        (jwtVerify as any).mockResolvedValue({ payload: { sub: { id: 1 } } });

        await middleware(req);

        expect((jwtVerify as any).mock.calls[0][0]).toBe('valid');
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('redirects and clears cookie if token is present but invalid/expired', async () => {
        const req = createRequest('/dashboard', 'token=tampered');
        (parse as any).mockReturnValue({ token: 'tampered' });
        (jwtVerify as any).mockRejectedValue(new Error('signature verification failed'));

        const result = await middleware(req);

        expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/', 'http://localhost/dashboard'));
        expect((result as any).cookies.delete).toHaveBeenCalledWith('token');
    });

    it('handles empty cookie header', async () => {
        const req = {
            nextUrl: { pathname: '/dashboard' },
            headers: {
                get: vi.fn().mockReturnValue(null),
            },
            url: 'http://localhost/dashboard',
        } as unknown as NextRequest;

        (parse as any).mockReturnValue({});

        await middleware(req);

        expect(NextResponse.redirect).toHaveBeenCalled();
    });
});
