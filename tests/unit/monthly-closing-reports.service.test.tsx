import { describe, it, expect, vi, beforeEach } from 'vitest';
import { monthlyClosingReportsService } from '@/services/monthly-closing-reports.service';
import api from '@/api-client.service';

vi.mock('@/api-client.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('monthlyClosingReportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getBySchool envia escola, mês de referência e usuário como filtros', async () => {
    const relatorios = [{ id: 1, status: 'DRAFT' }];
    (api.get as any).mockResolvedValue({ data: { data: relatorios } });

    const resultado = await monthlyClosingReportsService.getBySchool(5, '2026-08', 9);

    expect(api.get).toHaveBeenCalledWith('/monthly-closing-reports', {
      params: { schoolId: 5, referenceMonth: '2026-08', userId: 9 },
    });
    expect(resultado).toEqual(relatorios);
  });

  it('getBySchool aceita filtros opcionais ausentes e resposta sem envelope', async () => {
    const relatorios = [{ id: 2, status: 'REVIEWED' }];
    (api.get as any).mockResolvedValue({ data: relatorios });

    const resultado = await monthlyClosingReportsService.getBySchool(5);

    expect(api.get).toHaveBeenCalledWith('/monthly-closing-reports', {
      params: { schoolId: 5, referenceMonth: undefined, userId: undefined },
    });
    expect(resultado).toEqual(relatorios);
  });

  it('generate dispara a geração do relatório com o payload recebido', async () => {
    const payload = { schoolId: 5, referenceMonth: '2026-08' };
    const gerado = { id: 10, status: 'DRAFT' };
    (api.post as any).mockResolvedValue({ data: { data: gerado } });

    await expect(monthlyClosingReportsService.generate(payload as any)).resolves.toEqual(gerado);

    expect(api.post).toHaveBeenCalledWith('/monthly-closing-reports/generate', payload);
  });

  it('review e close usam PATCH nos endpoints do relatório', async () => {
    (api.patch as any)
      .mockResolvedValueOnce({ data: { data: { id: 3, status: 'REVIEWED' } } })
      .mockResolvedValueOnce({ data: { data: { id: 3, status: 'CLOSED' } } });

    await expect(monthlyClosingReportsService.review(3)).resolves.toMatchObject({
      status: 'REVIEWED',
    });
    await expect(monthlyClosingReportsService.close(3)).resolves.toMatchObject({
      status: 'CLOSED',
    });

    expect(api.patch).toHaveBeenNthCalledWith(1, '/monthly-closing-reports/3/review');
    expect(api.patch).toHaveBeenNthCalledWith(2, '/monthly-closing-reports/3/close');
  });

  it('reopen envia a justificativa obrigatória e devolve o relatório reaberto', async () => {
    const reaberto = { id: 3, status: 'DRAFT' };
    (api.patch as any).mockResolvedValue({ data: reaberto });

    await expect(
      monthlyClosingReportsService.reopen(3, 'Correção de carga horária'),
    ).resolves.toEqual(reaberto);

    expect(api.patch).toHaveBeenCalledWith('/monthly-closing-reports/3/reopen', {
      justification: 'Correção de carga horária',
    });
  });

  it('aceita respostas sem envelope em generate, review e close', async () => {
    (api.post as any).mockResolvedValue({ data: { id: 11, status: 'DRAFT' } });
    (api.patch as any).mockResolvedValue({ data: { id: 11, status: 'CLOSED' } });

    await expect(monthlyClosingReportsService.generate({} as any)).resolves.toEqual({
      id: 11,
      status: 'DRAFT',
    });
    await expect(monthlyClosingReportsService.review(11)).resolves.toEqual({
      id: 11,
      status: 'CLOSED',
    });
    await expect(monthlyClosingReportsService.close(11)).resolves.toEqual({
      id: 11,
      status: 'CLOSED',
    });
  });
});
