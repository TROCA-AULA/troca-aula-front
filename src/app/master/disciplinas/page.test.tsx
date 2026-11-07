import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import DisciplinasPage from './page';
import { masterService } from '@/services/master.service';

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/services/master.service', () => ({
  masterService: {
    getSubjects: vi.fn(),
    createSubject: vi.fn(),
    renameSubject: vi.fn(),
    deleteSubject: vi.fn(),
  },
}));

const subjects = [
  { id: 1, name: 'Matemática' },
  { id: 2, name: 'Português' },
];

describe('DisciplinasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(masterService.getSubjects).mockResolvedValue(subjects);
  });

  it('lista as disciplinas', async () => {
    render(<DisciplinasPage />);
    expect(await screen.findByText('Matemática')).toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();
  });

  it('mostra vazio quando não há disciplinas ou a busca falha', async () => {
    vi.mocked(masterService.getSubjects).mockRejectedValue(new Error('x'));
    render(<DisciplinasPage />);
    expect(await screen.findByText('Nenhuma disciplina cadastrada.')).toBeInTheDocument();
  });

  it('cria uma disciplina', async () => {
    vi.mocked(masterService.createSubject).mockResolvedValue({ id: 3, name: 'História' });
    render(<DisciplinasPage />);
    await screen.findByText('Matemática');

    const button = screen.getByRole('button', { name: 'Criar disciplina' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Nome da disciplina'), {
      target: { value: ' História ' },
    });
    fireEvent.click(button);

    await waitFor(() => expect(masterService.createSubject).toHaveBeenCalledWith('História'));
    expect(toast.success).toHaveBeenCalledWith('Disciplina "História" criada');
    expect(masterService.getSubjects).toHaveBeenCalledTimes(2);
  });

  it('não cria duplicada (ignora maiúsculas)', async () => {
    render(<DisciplinasPage />);
    await screen.findByText('Matemática');

    fireEvent.change(screen.getByLabelText('Nome da disciplina'), {
      target: { value: 'matemática' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar disciplina' }));

    expect(toast.error).toHaveBeenCalledWith('Já existe a disciplina "matemática".');
    expect(masterService.createSubject).not.toHaveBeenCalled();
  });

  it('não envia nome vazio e não quebra se o backend recusa', async () => {
    vi.mocked(masterService.createSubject).mockRejectedValue(new Error('400'));
    render(<DisciplinasPage />);
    await screen.findByText('Matemática');

    fireEvent.submit(screen.getByLabelText('Nome da disciplina').closest('form')!);
    expect(masterService.createSubject).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Nome da disciplina'), {
      target: { value: 'Artes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar disciplina' }));
    await waitFor(() => expect(masterService.createSubject).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Criar disciplina' })).toBeEnabled();
  });

  it('renomeia com Salvar e com Enter', async () => {
    vi.mocked(masterService.renameSubject).mockResolvedValue({ id: 1, name: 'Matemática I' });
    render(<DisciplinasPage />);
    await screen.findByText('Matemática');

    fireEvent.click(screen.getByLabelText('Renomear Matemática'));
    fireEvent.change(screen.getByLabelText('Novo nome de Matemática'), {
      target: { value: 'Matemática I' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(masterService.renameSubject).toHaveBeenCalledWith(1, 'Matemática I'),
    );
    expect(toast.success).toHaveBeenCalledWith('Disciplina renomeada');

    await screen.findByLabelText('Renomear Português');
    fireEvent.click(screen.getByLabelText('Renomear Português'));
    const input = screen.getByLabelText('Novo nome de Português');
    fireEvent.change(input, { target: { value: 'Língua Portuguesa' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(masterService.renameSubject).toHaveBeenCalledWith(2, 'Língua Portuguesa'),
    );
  });

  it('renomear: Esc e Cancelar descartam; nome repetido é recusado; erro não quebra', async () => {
    vi.mocked(masterService.renameSubject).mockRejectedValue(new Error('500'));
    render(<DisciplinasPage />);
    await screen.findByText('Matemática');

    fireEvent.click(screen.getByLabelText('Renomear Matemática'));
    fireEvent.keyDown(screen.getByLabelText('Novo nome de Matemática'), { key: 'Escape' });
    expect(screen.queryByLabelText('Novo nome de Matemática')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Renomear Matemática'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByLabelText('Novo nome de Matemática')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Renomear Matemática'));
    const input = screen.getByLabelText('Novo nome de Matemática');
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(masterService.renameSubject).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'português' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(toast.error).toHaveBeenCalledWith('Já existe a disciplina "português".');
    expect(masterService.renameSubject).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'Álgebra' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(masterService.renameSubject).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('remove após confirmar; cancelar não remove; erro não quebra', async () => {
    vi.mocked(masterService.deleteSubject).mockResolvedValueOnce();
    render(<DisciplinasPage />);
    await screen.findByText('Matemática');

    fireEvent.click(screen.getByLabelText('Remover Matemática'));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(masterService.deleteSubject).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Remover Matemática'));
    expect(screen.getByText(/continuam com ela até o gestor trocar/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(masterService.deleteSubject).toHaveBeenCalledWith(1));
    expect(toast.success).toHaveBeenCalledWith('Disciplina "Matemática" removida');

    vi.mocked(masterService.deleteSubject).mockRejectedValueOnce(new Error('500'));
    vi.mocked(toast.success).mockClear();
    await screen.findByLabelText('Remover Português');
    fireEvent.click(screen.getByLabelText('Remover Português'));
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(masterService.deleteSubject).toHaveBeenCalledWith(2));
    expect(toast.success).not.toHaveBeenCalled();
  });
});
