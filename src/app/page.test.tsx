import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Login Page (Home)', () => {
    const mockRouter = {
        push: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue(mockRouter);
        global.fetch = vi.fn();
    });

    it('renders login form', () => {
        render(<Home />);
        expect(screen.getByPlaceholderText('e-mail')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('senha')).toBeInTheDocument();
        expect(screen.getByText('Entrar')).toBeInTheDocument();
    });

    it('shows validation errors', async () => {
        render(<Home />);
        const submitButton = screen.getByText('Entrar');
        
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('E-mail é obrigatório')).toBeInTheDocument();
            expect(screen.getByText('Senha é obrigatório')).toBeInTheDocument();
        });
    });

    it('successful login', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
        });

        render(<Home />);
        
        fireEvent.change(screen.getByPlaceholderText('e-mail'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('senha'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByText('Entrar'));

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
            expect(toast.success).toHaveBeenCalledWith('Login realizado com sucesso');
        });
    });

    it('failed login response', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
        });

        render(<Home />);
        
        fireEvent.change(screen.getByPlaceholderText('e-mail'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('senha'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByText('Entrar'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao fazer login');
        });
    });

    it('login fetch throws error', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        render(<Home />);
        
        fireEvent.change(screen.getByPlaceholderText('e-mail'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('senha'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByText('Entrar'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao fazer login');
        });
    });
});
