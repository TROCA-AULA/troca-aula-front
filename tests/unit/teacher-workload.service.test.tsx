import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherWorkloadService } from '@/services/teacher-workload.service';
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

describe('teacherWorkloadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getBySchool lista os registros da escola com o filtro obrigatório', async () => {
    const registros = [{ id: 1, schoolId: 4 }];
    (api.get as any).mockResolvedValue({ data: { data: registros } });

    await expect(teacherWorkloadService.getBySchool(4)).resolves.toEqual(registros);

    expect(api.get).toHaveBeenCalledWith('/teacher-workload-records', {
      params: { schoolId: 4 },
    });
  });

  it('getMine usa a rota do próprio professor', async () => {
    const registros = [{ id: 2, schoolId: 4 }];
    (api.get as any).mockResolvedValue({ data: { data: registros } });

    await expect(teacherWorkloadService.getMine()).resolves.toEqual(registros);

    expect(api.get).toHaveBeenCalledWith('/teacher-workload-records/me');
  });

  it('create envia o registro para o endpoint de criação', async () => {
    const payload = { schoolId: 4, workloadMinutes: 100 };
    const criado = { id: 5, ...payload };
    (api.post as any).mockResolvedValue({ data: { data: criado } });

    await expect(teacherWorkloadService.create(payload as any)).resolves.toEqual(criado);

    expect(api.post).toHaveBeenCalledWith('/teacher-workload-records', payload);
  });

  it('remove chama DELETE do registro informado', async () => {
    (api.delete as any).mockResolvedValue({ data: {} });

    await teacherWorkloadService.remove(5);

    expect(api.delete).toHaveBeenCalledWith('/teacher-workload-records/5');
  });

  it('lida com respostas sem envelope em todas as leituras', async () => {
    (api.get as any).mockResolvedValue({ data: [{ id: 1 }] });

    await expect(teacherWorkloadService.getBySchool(4)).resolves.toEqual([{ id: 1 }]);
    await expect(teacherWorkloadService.getMine()).resolves.toEqual([{ id: 1 }]);
  });

  it('create aceita resposta sem envelope', async () => {
    (api.post as any).mockResolvedValue({ data: { id: 6 } });

    await expect(
      teacherWorkloadService.create({ schoolId: 4, workloadMinutes: 50 } as any),
    ).resolves.toEqual({ id: 6 });
  });
});
