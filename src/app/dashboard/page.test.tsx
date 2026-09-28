import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';
import api from '@/api-client.service';
import axios from 'axios';
import { toast } from 'react-toastify';

vi.mock('@/contexts/SchoolContext', () => ({
    useSchoolContext: vi.fn(),
}));

vi.mock('@/api-client.service', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

vi.mock('axios', () => {
    const mockAxios: Record<string, any> = {
        get: vi.fn(),
        delete: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    };
    mockAxios.create = vi.fn().mockReturnValue(mockAxios);
    return { default: mockAxios };
});

vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Dashboard Page', () => {
    // profileId: PROFILE.MASTER porque vários testes abaixo esperam o
    // comportamento "vê todas as escolas" (chamada a GET /schools), que
    // agora corretamente exige MASTER (4) em vez do valor antigo (1, que é
    // DIRETOR — ver src/constants/profile.ts).
    const mockUser = { id: 1, name: 'Test User', profileId: PROFILE.MASTER };
    const mockLogout = vi.fn();
    const mockRefreshUserData = vi.fn();

    const mockClasses = [
        {
            id: 1,
            subject: { name: 'Math' },
            school: { name: 'School A' },
            statededAt: '2023-01-01T10:00:00Z',
            finishedAt: '2023-01-01T11:00:00Z',
            enrolledById: null,
        },
        {
            id: 2,
            subject: { name: 'Science' },
            school: { name: 'School B' },
            statededAt: '2023-01-01T12:00:00Z',
            finishedAt: '2023-01-01T13:00:00Z',
            enrolledById: 1,
            enrolledBy: { name: 'Test User' },
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useSchoolContext as any).mockReturnValue({
            user: mockUser,
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        (axios.get as any).mockResolvedValue({ data: mockClasses });
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/schools/1') return Promise.resolve({ data: { id: 1, name: 'School A' } });
            if (url === '/schools') return Promise.resolve({ data: [{ id: 1, name: 'School A' }] });
            if (url === '/subjects') return Promise.resolve({ data: [{ id: 1, name: 'Math' }] });
            return Promise.resolve({ data: [] });
        });
    });

    it('renders and loads data', async () => {
        render(<Home />);

        expect(screen.getByText(/Olá, Test User/)).toBeInTheDocument();

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/classes', expect.any(Object));
            expect(api.get).toHaveBeenCalledWith('/schools');
            expect(api.get).toHaveBeenCalledWith('/subjects');
        });
    });

    it('filters classes based on tabs', async () => {
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());
        expect(screen.queryByRole('cell', { name: 'Science' })).not.toBeInTheDocument(); // enrolledById != null is hidden in "Aulas Disponiveis"

        const myClassesButton = screen.getByText('Aulas aceitas');
        fireEvent.click(myClassesButton);

        await waitFor(() => {
            expect(screen.getByRole('cell', { name: 'Science' })).toBeInTheDocument();
            expect(screen.queryByRole('cell', { name: 'Math' })).not.toBeInTheDocument();
        });
    });

    it('handles search', async () => {
        render(<Home />);

        const searchInput = screen.getByPlaceholderText('Pesquisar');
        fireEvent.change(searchInput, { target: { value: 'Math' } });

        const searchButton = screen.getByText('Buscar');
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument();
        });
    });

    it('submits a new class', async () => {
        (api.post as any).mockResolvedValue({});
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());

        const subjectSelect = screen.getAllByRole('combobox')[1]; // Second combobox is subject
        fireEvent.change(subjectSelect, { target: { value: '1' } });
        fireEvent.change(screen.getByPlaceholderText('Inicio'), { target: { value: '2023-01-01T10:00' } });
        fireEvent.change(screen.getByPlaceholderText('Termino'), { target: { value: '2023-01-01T11:00' } });

        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/classes', expect.any(Object));
            expect(toast.success).toHaveBeenCalledWith('Aula cadastrada com sucesso');
        });
    });

    it('handles submit error', async () => {
        (api.post as any).mockRejectedValue(new Error('Fail'));
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());

        const subjectSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(subjectSelect, { target: { value: '1' } });
        fireEvent.change(screen.getByPlaceholderText('Inicio'), { target: { value: '2023-01-01T10:00' } });
        fireEvent.change(screen.getByPlaceholderText('Termino'), { target: { value: '2023-01-01T11:00' } });

        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao cadastrar aula');
        });
    });

    it('deletes a class', async () => {
        (axios.delete as any).mockResolvedValue({});
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());

        const deleteButton = screen.getByText('deletar');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith('/api/classes/1');
            expect(toast.success).toHaveBeenCalledWith('Aula removida com sucesso');
        });
    });

    it('handles delete error', async () => {
        (axios.delete as any).mockRejectedValue(new Error('Fail'));
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());

        const deleteButton = screen.getByText('deletar');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao remover aula');
        });
    });

    it('shows the enrolled professor name and no action buttons on accepted classes', async () => {
        render(<Home />);

        const myClassesButton = screen.getByText('Aulas aceitas');
        fireEvent.click(myClassesButton);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Science' })).toBeInTheDocument());

        // `enrolledBy` agora vem populado do backend (ClassesRepository) - a
        // tabela mostra o nome do professor e nada de aceitar/deletar.
        expect(screen.getByRole('cell', { name: 'Test User' })).toBeInTheDocument();
        expect(screen.queryByText('aceitar')).not.toBeInTheDocument();
        expect(screen.queryByText('deletar')).not.toBeInTheDocument();
    });

    it('does not render the accept button for managers', async () => {
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());

        // Aprovar candidatura vive em /master/professores (aba Candidaturas);
        // o dashboard legado so mostra "deletar" para aula vaga.
        expect(screen.queryByText('aceitar')).not.toBeInTheDocument();
        expect(screen.getByText('deletar')).toBeInTheDocument();
    });

    it('calls logout when button clicked', () => {
        render(<Home />);
        fireEvent.click(screen.getByText('Sair'));
        expect(mockLogout).toHaveBeenCalled();
    });

    it('refreshes user data if no user', () => {
        (useSchoolContext as any).mockReturnValue({
            user: null,
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        render(<Home />);
        expect(mockRefreshUserData).toHaveBeenCalled();
    });

    it('allows teacher to apply to an available class', async () => {
        (useSchoolContext as any).mockReturnValue({
            user: { ...mockUser, profileId: PROFILE.PROFESSOR, schoolId: 1 },
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        (api.post as any).mockResolvedValue({});

        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());

        const acceptButton = screen.getByText('aceitar');
        fireEvent.click(acceptButton);

        await waitFor(() => {
            // Candidatura via EnrollmentRequests (fluxo real), nao mais
            // PATCH /api/classes/:id da era do swap-request.
            expect(api.post).toHaveBeenCalledWith('/enrollment-requests/request/1');
            expect(toast.success).toHaveBeenCalledWith('Candidatura enviada com sucesso');
        });
    });

    it('handles apply error for teacher', async () => {
        (useSchoolContext as any).mockReturnValue({
            user: { ...mockUser, profileId: PROFILE.PROFESSOR, schoolId: 1 },
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        (api.post as any).mockRejectedValue(new Error('Fail'));

        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());

        const acceptButton = screen.getByText('aceitar');
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao enviar candidatura');
        });
    });

    it('handles subjects and school fetch error', async () => {
        (api.get as any).mockImplementation((url: string) => {
             return Promise.reject(new Error('Network error'));
        });
        render(<Home />);
        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/schools');
            expect(api.get).toHaveBeenCalledWith('/subjects');
        });
    });

    it('renders "Minhas Aulas" tab for teachers', async () => {
        (useSchoolContext as any).mockReturnValue({
            user: { ...mockUser, profileId: 3 },
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        render(<Home />);

        const myClassesButton = screen.getByText('Minhas Aulas');
        fireEvent.click(myClassesButton);

        expect(myClassesButton).toHaveClass('active');
    });

    it('filters correctly for teachers in "Minhas Aulas"', async () => {
        (useSchoolContext as any).mockReturnValue({
            user: { ...mockUser, profileId: 3 },
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        render(<Home />);

        const myClassesButton = screen.getByText('Minhas Aulas');
        fireEvent.click(myClassesButton);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Science' })).toBeInTheDocument());
        expect(screen.queryByRole('cell', { name: 'Math' })).not.toBeInTheDocument();
    });

    it('filters by search text', async () => {
        render(<Home />);

        const searchInput = screen.getByPlaceholderText('Pesquisar');
        fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
        fireEvent.click(screen.getByText('Buscar'));

        await waitFor(() => {
            expect(screen.queryByRole('cell', { name: 'Math' })).not.toBeInTheDocument();
        });
    });

    it('shows classes when profileId is not 3 and not "all"', async () => {
         (useSchoolContext as any).mockReturnValue({
            user: { ...mockUser, profileId: PROFILE.MASTER },
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        render(<Home />);

        const acceptedButton = screen.getByText('Aulas aceitas');
        fireEvent.click(acceptedButton);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Science' })).toBeInTheDocument());
    });
});
