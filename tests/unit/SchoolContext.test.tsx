import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { SchoolProvider, useSchoolContext } from '@/contexts/SchoolContext';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

function Probe() {
    const { activeNetworkId, activeSchoolId, schoolLinks } = useSchoolContext();
    return (
        <div>
            <span data-testid="network">{String(activeNetworkId)}</span>
            <span data-testid="school">{String(activeSchoolId)}</span>
            <span data-testid="links">{schoolLinks.length}</span>
        </div>
    );
}

describe('SchoolContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
    });

    it('exposes activeNetworkId from the active school link (claim do JWT)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                id: 1,
                name: 'Test User',
                email: 'test@test.com',
                profileId: 3,
                schoolId: 10,
                schoolLinks: [
                    { profileId: 3, schoolId: 10, approvedAt: '2026-01-01T00:00:00Z', networkId: 5 },
                ],
            }),
        }) as unknown as typeof fetch;

        render(
            <SchoolProvider>
                <Probe />
            </SchoolProvider>,
        );

        await waitFor(() => expect(screen.getByTestId('network')).toHaveTextContent('5'));
        expect(screen.getByTestId('school')).toHaveTextContent('10');
    });

    it('falls back to null networkId for old tokens sem o claim', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                id: 1,
                name: 'Test User',
                email: 'test@test.com',
                schoolLinks: [
                    { profileId: 3, schoolId: 10, approvedAt: null },
                ],
            }),
        }) as unknown as typeof fetch;

        render(
            <SchoolProvider>
                <Probe />
            </SchoolProvider>,
        );

        await waitFor(() => expect(screen.getByTestId('school')).toHaveTextContent('10'));
        expect(screen.getByTestId('network')).toHaveTextContent('null');
    });
});
