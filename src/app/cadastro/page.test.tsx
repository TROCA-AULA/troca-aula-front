import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import { useSubjects } from '@/hooks/useSubjects';
import { toast } from 'react-toastify';
import api from '@/api-client.service';

const push = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
}));

vi.mock('@/hooks/useSubjects', () => ({
    useSubjects: vi.fn(),
}));

vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// P9 (problemas-conhecidos.md): a página passou a usar o cliente do
// navegador (`api-client.service`), não o server-side (`api.service`).
vi.mock('@/api-client.service', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('Cadastro Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useSubjects).mockReturnValue({
            subjects: [
                { id: 1, name: 'Matemática' },
                { id: 2, name: 'História' },
            ],
        });
    });

    it('renders cadastro form', () => {
        render(<Home />);
        expect(screen.getByPlaceholderText('nome')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e-mail')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('telefone')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('senha (mínimo 8 caracteres)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('confirme a senha')).toBeInTheDocument();
        expect(screen.getByText('Cadastrar')).toBeInTheDocument();
    });

    it('shows validation errors', async () => {
        render(<Home />);
        const submitButton = screen.getByText('Cadastrar');
        
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
            expect(screen.getByText('E-mail é obrigatório')).toBeInTheDocument();
            expect(screen.getByText('Telefone é obrigatório')).toBeInTheDocument();
            expect(screen.getByText('Senha é obrigatório')).toBeInTheDocument();
        });
    });

    it('shows error when passwords do not match', async () => {
        render(<Home />);
        
        fireEvent.change(screen.getByPlaceholderText('senha (mínimo 8 caracteres)'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('confirme a senha'), { target: { value: 'password456' } });
        
        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(screen.getByText('As senhas não conferem')).toBeInTheDocument();
        });
    });

    it('successful registration', async () => {
        (api.post as any).mockResolvedValue({ data: {} });

        render(<Home />);
        
        fireEvent.change(screen.getByPlaceholderText('nome'), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText('e-mail'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('telefone'), { target: { value: '123456789' } });
        fireEvent.change(screen.getByPlaceholderText('senha (mínimo 8 caracteres)'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('confirme a senha'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/users', {
                name: 'Test',
                email: 'test@example.com',
                phone: '123456789',
                password: 'password123',
            });
            expect(toast.success).toHaveBeenCalledWith('Usuário cadastrado com sucesso');
            expect(push).toHaveBeenCalledWith('/');
        });
    });

    it('handles registration error', async () => {
        const error = new Error('Registration failed');
        (api.post as any).mockRejectedValue(error);
        console.error = vi.fn();

        render(<Home />);
        
        fireEvent.change(screen.getByPlaceholderText('nome'), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText('e-mail'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('telefone'), { target: { value: '123456789' } });
        fireEvent.change(screen.getByPlaceholderText('senha (mínimo 8 caracteres)'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('confirme a senha'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(error);
        });
        expect(toast.success).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });

    it('envia a disciplina escolhida (D9)', async () => {
        (api.post as any).mockResolvedValue({ data: {} });

        render(<Home />);

        fireEvent.change(screen.getByPlaceholderText('nome'), { target: { value: 'Ana' } });
        fireEvent.change(screen.getByPlaceholderText('e-mail'), { target: { value: 'ana@x.com' } });
        fireEvent.change(screen.getByPlaceholderText('telefone'), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText('disciplina'), { target: { value: '2' } });
        fireEvent.change(screen.getByPlaceholderText('senha (mínimo 8 caracteres)'), { target: { value: 'Senha@123' } });
        fireEvent.change(screen.getByPlaceholderText('confirme a senha'), { target: { value: 'Senha@123' } });

        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({ subjectId: 2 }));
        });
    });

    it('recusa senha com menos de 8 caracteres (D10)', async () => {
        render(<Home />);

        fireEvent.change(screen.getByPlaceholderText('senha (mínimo 8 caracteres)'), { target: { value: '123' } });
        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres')).toBeInTheDocument();
        });
        expect(api.post).not.toHaveBeenCalled();
    });
});
