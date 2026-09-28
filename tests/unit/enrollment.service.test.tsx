import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enrollmentService } from '@/services/enrollment.service';
import api from '@/api-client.service';

vi.mock('@/api-client.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('enrollmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAvailableClasses chama /classes?available=true', async () => {
    const classes = [{ id: 1, subjectId: 2, statededAt: null, available: true }];
    (api.get as any).mockResolvedValue({ data: classes });

    const result = await enrollmentService.getAvailableClasses();

    expect(api.get).toHaveBeenCalledWith('/classes?available=true');
    expect(result).toEqual(classes);
  });

  it('getEnrollments monta os filtros na query string', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    await enrollmentService.getEnrollments({ userId: 7, status: 'PENDING' });

    expect(api.get).toHaveBeenCalledWith(
      '/enrollment-requests?userId=7&status=PENDING',
    );
  });

  it('createEnrollment usa a rota de candidatura com o classId', async () => {
    (api.post as any).mockResolvedValue({ data: { id: 1, status: 'PENDING' } });

    await enrollmentService.createEnrollment({ classId: 42 });

    expect(api.post).toHaveBeenCalledWith('/enrollment-requests/request/42');
  });

  it('approveEnrollment e rejectEnrollment usam os endpoints de decisão', async () => {
    (api.patch as any).mockResolvedValue({ data: { id: 1 } });

    await enrollmentService.approveEnrollment(1);
    await enrollmentService.rejectEnrollment(2, 'Sem disponibilidade');

    expect(api.patch).toHaveBeenNthCalledWith(1, '/enrollment-requests/1/approve');
    expect(api.patch).toHaveBeenNthCalledWith(2, '/enrollment-requests/2/reject', {
      rejectionReason: 'Sem disponibilidade',
    });
  });

  it('cancelEnrollment chama DELETE /enrollment-requests/:id', async () => {
    (api.delete as any).mockResolvedValue({ data: { id: 1 } });

    await enrollmentService.cancelEnrollment(3);

    expect(api.delete).toHaveBeenCalledWith('/enrollment-requests/3');
  });

  it('getEnrollment busca a solicitação pelo id (com e sem envelope)', async () => {
    (api.get as any)
      .mockResolvedValueOnce({ data: { data: { id: 7, status: 'PENDING' } } })
      .mockResolvedValueOnce({ data: { id: 8, status: 'APPROVED' } });

    await expect(enrollmentService.getEnrollment(7)).resolves.toEqual({
      id: 7,
      status: 'PENDING',
    });
    await expect(enrollmentService.getEnrollment(8)).resolves.toEqual({
      id: 8,
      status: 'APPROVED',
    });

    expect(api.get).toHaveBeenNthCalledWith(1, '/enrollment-requests/7');
    expect(api.get).toHaveBeenNthCalledWith(2, '/enrollment-requests/8');
  });

  it('getEnrollments usa professorId quando não há userId e inclui escola e status', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    await enrollmentService.getEnrollments({
      professorId: 3,
      status: 'APPROVED',
      schoolId: 2,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/enrollment-requests?professorId=3&status=APPROVED&schoolId=2',
    );
  });

  it('getEnrollments prioriza userId sobre professorId', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    await enrollmentService.getEnrollments({ userId: 7, professorId: 3 });

    expect(api.get).toHaveBeenCalledWith('/enrollment-requests?userId=7');
  });

  it('getEnrollments sem filtros usa a query vazia', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    await enrollmentService.getEnrollments();

    expect(api.get).toHaveBeenCalledWith('/enrollment-requests?');
  });

  it('getAvailableClasses e getEnrollments aceitam resposta sem envelope', async () => {
    const classes = [{ id: 1, available: true }];
    const solicitacoes = [{ id: 4, status: 'PENDING' }];
    (api.get as any)
      .mockResolvedValueOnce({ data: { data: classes } })
      .mockResolvedValueOnce({ data: solicitacoes });

    await expect(enrollmentService.getAvailableClasses()).resolves.toEqual(classes);
    await expect(enrollmentService.getEnrollments({ userId: 4 })).resolves.toEqual(
      solicitacoes,
    );
  });

  it('approveEnrollment devolve a solicitação usando o envelope quando existe', async () => {
    (api.patch as any).mockResolvedValue({
      data: { data: { id: 5, status: 'APPROVED' } },
    });

    await expect(enrollmentService.approveEnrollment(5)).resolves.toEqual({
      id: 5,
      status: 'APPROVED',
    });

    expect(api.patch).toHaveBeenCalledWith('/enrollment-requests/5/approve');
  });

  it('rejectEnrollment sem motivo envia rejectionReason indefinido', async () => {
    (api.patch as any).mockResolvedValue({ data: { data: { id: 6, status: 'REJECTED' } } });

    await enrollmentService.rejectEnrollment(6);

    expect(api.patch).toHaveBeenCalledWith('/enrollment-requests/6/reject', {
      rejectionReason: undefined,
    });
  });

  it('cancelEnrollment aceita resposta sem envelope', async () => {
    (api.delete as any).mockResolvedValue({ data: { id: 9, status: 'CANCELLED' } });

    await expect(enrollmentService.cancelEnrollment(9)).resolves.toEqual({
      id: 9,
      status: 'CANCELLED',
    });
  });
});
