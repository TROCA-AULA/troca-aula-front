import { render, screen, fireEvent, waitFor, act } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkloadRecordForm } from './WorkloadRecordForm';
import { useTeachers } from '@/hooks/useTeachers';

vi.mock('@/hooks/useTeachers', () => ({ useTeachers: vi.fn() }));

const fetchLinkedTeachers = vi.fn();
const onClose = vi.fn();
const onSubmit = vi.fn();

function mockTeachers(loading = false) {
  vi.mocked(useTeachers).mockReturnValue({
    linkedTeachers: [
      { id: 7, name: 'Maria', email: 'm@e.com', profileId: 3, totalSubstitutions: 0 },
      { id: 8, name: 'João', email: 'j@e.com', profileId: 3, totalSubstitutions: 1 },
    ],
    availableTeachers: [],
    enrollmentRequests: [],
    loading,
    error: null,
    fetchLinkedTeachers,
    fetchAvailableTeachers: vi.fn(),
    fetchEnrollmentRequests: vi.fn(),
    linkTeacher: vi.fn(),
    unlinkTeacher: vi.fn(),
    updateEnrollmentStatus: vi.fn(),
  } as any);
}

function renderForm(open = true) {
  return render(
    <WorkloadRecordForm open={open} schoolId={4} onClose={onClose} onSubmit={onSubmit} />,
  );
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Professor *'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Tipo de Carga *'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Horas *'), { target: { value: '6' } });
}

describe('WorkloadRecordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTeachers();
  });

  it('não renderiza nada quando fechado e não busca professores', () => {
    renderForm(false);

    expect(screen.queryByText('Novo Registro de Jornada')).not.toBeInTheDocument();
    expect(fetchLinkedTeachers).not.toHaveBeenCalled();
  });

  it('busca os professores vinculados e lista as opções quando aberto', () => {
    renderForm();

    expect(screen.getByText('Novo Registro de Jornada')).toBeInTheDocument();
    expect(fetchLinkedTeachers).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('option', { name: 'Maria' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'João' })).toBeInTheDocument();
    // Catálogo fixo de tipos de carga.
    expect(
      screen.getByRole('option', { name: 'Carga suplementar' }),
    ).toBeInTheDocument();
  });

  it('desabilita o select de professor enquanto os professores carregam', () => {
    mockTeachers(true);
    renderForm();

    expect(screen.getByLabelText('Professor *')).toBeDisabled();
  });

  it('valida os campos obrigatórios antes de enviar', async () => {
    renderForm();

    fireEvent.click(screen.getByText('Salvar'));

    expect(await screen.findByText('Selecione um professor')).toBeInTheDocument();
    expect(screen.getByText('Selecione um tipo de carga')).toBeInTheDocument();
    expect(screen.getByText('Informe as horas')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia o payload completo com os campos opcionais preenchidos', async () => {
    onSubmit.mockResolvedValue({ id: 1 });
    renderForm();

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText('Vigência - fim (opcional)'), {
      target: { value: '2026-12-31' },
    });
    fireEvent.change(screen.getByLabelText('Referência da ata oficial (opcional)'), {
      target: { value: 'ATA-2026-045' },
    });
    fireEvent.change(screen.getByLabelText('Justificativa (opcional)'), {
      target: { value: 'Substituição temporária' },
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        userId: 7,
        schoolId: 4,
        workloadTypeId: 4,
        hours: 6,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: '2026-12-31',
        ataOficialRef: 'ATA-2026-045',
        justification: 'Substituição temporária',
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('envia undefined nos campos opcionais em branco e limpa o formulário', async () => {
    onSubmit.mockResolvedValue({ id: 1 });
    renderForm();

    fillRequiredFields();
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          validTo: undefined,
          ataOficialRef: undefined,
          justification: undefined,
        }),
      ),
    );

    // reset() volta o select para a opção vazia depois do sucesso.
    await waitFor(() =>
      expect((screen.getByLabelText('Professor *') as HTMLSelectElement).value).toBe(''),
    );
  });

  it('mostra "Salvando..." e desabilita o botão enquanto o envio está em andamento', async () => {
    let resolveSubmit: (value: unknown) => void = () => {};
    onSubmit.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    renderForm();

    fillRequiredFields();
    fireEvent.click(screen.getByText('Salvar'));

    const savingButton = await screen.findByText('Salvando...');
    expect(savingButton).toBeDisabled();

    await act(async () => {
      resolveSubmit({ id: 1 });
    });

    await waitFor(() => expect(screen.getByText('Salvar')).toBeInTheDocument());
  });

  it('exibe a mensagem pronta do backend quando o envio falha', async () => {
    onSubmit.mockRejectedValue({
      response: { data: { message: '12h somadas, limite da rede é 10h/semana' } },
    });
    renderForm();

    fillRequiredFields();
    fireEvent.click(screen.getByText('Salvar'));

    expect(
      await screen.findByText('12h somadas, limite da rede é 10h/semana'),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('usa a mensagem do Error quando a falha não tem resposta do backend', async () => {
    onSubmit.mockRejectedValue(new Error('Erro de rede'));
    renderForm();

    fillRequiredFields();
    fireEvent.click(screen.getByText('Salvar'));

    expect(await screen.findByText('Erro de rede')).toBeInTheDocument();
  });

  it('usa a mensagem padrão quando a falha não é um Error', async () => {
    onSubmit.mockRejectedValue('falha desconhecida');
    renderForm();

    fillRequiredFields();
    fireEvent.click(screen.getByText('Salvar'));

    expect(await screen.findByText('Erro ao criar registro')).toBeInTheDocument();
  });

  it('fecha ao clicar no overlay e no botão Cancelar, sem fechar ao clicar no modal', () => {
    renderForm();

    fireEvent.click(screen.getByText('Novo Registro de Jornada'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);

    const overlay = screen.getByText('Novo Registro de Jornada').parentElement
      ?.parentElement as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
