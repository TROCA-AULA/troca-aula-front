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
});
