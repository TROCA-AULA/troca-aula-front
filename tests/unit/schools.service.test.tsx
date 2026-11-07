import { describe, it, expect, vi, beforeEach } from 'vitest';
import { schoolsService } from '@/services/schools.service';
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

describe('schoolsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSchools lista as escolas', async () => {
    const escolas = [{ id: 1, name: 'Escola A' }];
    (api.get as any).mockResolvedValue({ data: { data: escolas } });

    await expect(schoolsService.getSchools()).resolves.toEqual(escolas);

    expect(api.get).toHaveBeenCalledWith('/schools');
  });

  it('getSchool busca a escola pelo id', async () => {
    const escola = { id: 3, name: 'Escola C' };
    (api.get as any).mockResolvedValue({ data: { data: escola } });

    await expect(schoolsService.getSchool(3)).resolves.toEqual(escola);

    expect(api.get).toHaveBeenCalledWith('/schools/3');
  });

  it('lida com respostas sem envelope', async () => {
    (api.get as any)
      .mockResolvedValueOnce({ data: [{ id: 1 }] })
      .mockResolvedValueOnce({ data: { id: 2 } });

    await expect(schoolsService.getSchools()).resolves.toEqual([{ id: 1 }]);
    await expect(schoolsService.getSchool(2)).resolves.toEqual({ id: 2 });
  });
});
