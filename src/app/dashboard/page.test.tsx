import { render, screen, fireEvent, waitFor, act } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';
import api from '@/api-client.service';
import { toast } from 'react-toastify';

vi.mock('@/contexts/SchoolContext', () => ({
    useSchoolContext: vi.fn(),
}));

vi.mock('@/api-client.service', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

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
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/classes') return Promise.resolve({ data: mockClasses });
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
            expect(api.get).toHaveBeenCalledWith('/classes');
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

        // Voltar para a aba de aulas disponíveis mostra as vagas de novo.
        fireEvent.click(screen.getByText('Aulas Disponiveis'));

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());
        expect(screen.getByText('Aulas Disponiveis')).toHaveClass('active');
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
        (api.delete as any).mockResolvedValue({});
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());

        const deleteButton = screen.getByText('deletar');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/classes/1');
            expect(toast.success).toHaveBeenCalledWith('Aula removida com sucesso');
        });
    });

    it('handles delete error', async () => {
        (api.delete as any).mockRejectedValue(new Error('Fail'));
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
             if (url === '/classes') return Promise.resolve({ data: mockClasses });
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

    it('abre a aba Candidaturas para a equipe', async () => {
        render(<Home />);

        fireEvent.click(screen.getByText('Candidaturas'));

        await waitFor(() =>
            expect(screen.getByText('Nenhuma candidatura pending encontrada.')).toBeInTheDocument(),
        );
    });

    it('permite ao MASTER trocar a escola do formulário', async () => {
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/classes') return Promise.resolve({ data: mockClasses });
            if (url === '/schools') {
                return Promise.resolve({
                    data: [
                        { id: 1, name: 'School A' },
                        { id: 2, name: 'School B' },
                    ],
                });
            }
            return Promise.resolve({ data: [] });
        });
        render(<Home />);

        const schoolSelect = (await screen.findAllByRole('combobox'))[0];
        await waitFor(() => expect(schoolSelect).toHaveValue('1'));

        fireEvent.change(schoolSelect, { target: { value: '2' } });

        expect(schoolSelect).toHaveValue('2');
    });

    it('carrega a escola do diretor e mostra o nome no formulário', async () => {
        (useSchoolContext as any).mockReturnValue({
            user: { ...mockUser, profileId: PROFILE.DIRETOR, schoolId: 1 },
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        render(<Home />);

        expect(await screen.findByDisplayValue('School A')).toBeInTheDocument();
        expect(api.get).toHaveBeenCalledWith('/schools/1');
    });

    it('lida com MASTER sem escolas cadastradas', async () => {
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/classes') return Promise.resolve({ data: mockClasses });
            if (url === '/schools') return Promise.resolve({ data: null });
            return Promise.resolve({ data: [] });
        });
        render(<Home />);

        const schoolSelect = (await screen.findAllByRole('combobox'))[0];
        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/schools'));
        expect(schoolSelect).toHaveValue('');
    });

    it('mostra "-" quando a aula não tem datas preenchidas', async () => {
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/classes') {
                return Promise.resolve({
                    data: [
                        {
                            id: 9,
                            subject: { name: 'História' },
                            school: { name: 'School A' },
                            statededAt: null,
                            finishedAt: null,
                            enrolledById: null,
                        },
                    ],
                });
            }
            if (url === '/schools') return Promise.resolve({ data: [{ id: 1, name: 'School A' }] });
            return Promise.resolve({ data: [] });
        });
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'História' })).toBeInTheDocument());
        expect(screen.getAllByRole('cell', { name: '-' }).length).toBeGreaterThanOrEqual(2);
    });

    it('mostra os erros de validação ao cadastrar sem preencher', async () => {
        render(<Home />);

        await waitFor(() => expect(screen.getByRole('cell', { name: 'Math' })).toBeInTheDocument());
        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(screen.getByText('Materia é obrigatório')).toBeInTheDocument();
            expect(screen.getByText('Inicio é obrigatório')).toBeInTheDocument();
            expect(screen.getByText('Termino é obrigatório')).toBeInTheDocument();
        });
        expect(api.post).not.toHaveBeenCalled();
    });

    it('lida com falha ao carregar a escola do diretor', async () => {
        (useSchoolContext as any).mockReturnValue({
            user: { ...mockUser, profileId: PROFILE.DIRETOR, schoolId: 1 },
            logout: mockLogout,
            refreshUserData: mockRefreshUserData,
        });
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/classes') return Promise.resolve({ data: mockClasses });
            if (url === '/schools/1') return Promise.reject(new Error('fail'));
            return Promise.resolve({ data: [] });
        });
        render(<Home />);

        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/schools/1'));
        expect(screen.getByDisplayValue('Nome da Escola')).toBeInTheDocument();
    });
});
