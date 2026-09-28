import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import { redirect } from 'next/navigation';
import { toast } from 'react-toastify';
import api from '@/api-client.service';

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
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
    });

    it('renders cadastro form', () => {
        render(<Home />);
        expect(screen.getByPlaceholderText('nome')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e-mail')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('telefone')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('senha')).toBeInTheDocument();
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
        
        fireEvent.change(screen.getByPlaceholderText('senha'), { target: { value: 'password123' } });
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
        fireEvent.change(screen.getByPlaceholderText('senha'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('confirme a senha'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/users', expect.any(Object));
            expect(toast.success).toHaveBeenCalledWith('Usuário cadastrado com sucesso');
            expect(redirect).toHaveBeenCalledWith('/');
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
        fireEvent.change(screen.getByPlaceholderText('senha'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('confirme a senha'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByText('Cadastrar'));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(error);
        });
    });
});
