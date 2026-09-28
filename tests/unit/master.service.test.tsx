import { describe, it, expect, vi, beforeEach } from 'vitest';
import { masterService } from '@/services/master.service';
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

describe('masterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSchools/getUsers usam os endpoints com filtros', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    await masterService.getSchools();
    await masterService.getUsers(3, 1);

    expect(api.get).toHaveBeenCalledWith('/schools');
    expect(api.get).toHaveBeenCalledWith('/users?profileId=3&schoolId=1');
  });

  it('createUser cria em um passo (o vínculo é feito à parte via assign-profile)', async () => {
    (api.post as any).mockResolvedValue({ data: { id: 9 } });

    await masterService.createUser({
      name: 'Novo Diretor',
      email: 'd@e.com',
      phone: '1',
      password: 'senha123',
    } as any);

    expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({ email: 'd@e.com' }));
  });

  it('updateSchoolPriorityWindow usa o endpoint dedicado da escola', async () => {
    (api.patch as any).mockResolvedValue({ data: { id: 1 } });

    await masterService.updateSchoolPriorityWindow(1, 24);

    expect(api.patch).toHaveBeenCalledWith('/schools/1/priority-window', {
      priorityWindowHours: 24,
    });
  });

  it('getAuditLogByNetwork consulta a auditoria por rede', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    await masterService.getAuditLogByNetwork(5);

    expect(api.get).toHaveBeenCalledWith('/audit-log/network/5');
  });

  it('getDashboardStats agrega escolas, aulas vagas e substituições do mês', async () => {
    const thisMonth = new Date().toISOString();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/schools') return Promise.resolve({ data: [{ id: 1 }, { id: 2 }] });
      if (url === '/classes?available=true')
        return Promise.resolve({ data: [{ id: 1 }] });
      if (url.startsWith('/enrollment-requests'))
        return Promise.resolve({
          data: [
            { id: 1, createdAt: thisMonth },
            { id: 2, createdAt: thisMonth },
            { id: 3, createdAt: thisMonth },
          ],
        });
      return Promise.resolve({ data: [] });
    });

    const stats = await masterService.getDashboardStats();

    expect(stats.totalSchools).toBe(2);
    expect(stats.totalClassesAvailable).toBe(1);
    expect(stats.totalSubstitutionsThisMonth).toBe(3);
  });
});
