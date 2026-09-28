import { describe, it, expect, vi, beforeEach } from 'vitest';
import { indicatorsService } from '@/services/indicators.service';
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

describe('indicatorsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCoverageStats monta a query com escola, disciplina e dia da semana', async () => {
    const stats = { totalClasses: 10, coveredClasses: 8 };
    (api.get as any).mockResolvedValue({ data: { data: stats } });

    const resultado = await indicatorsService.getCoverageStats({
      schoolId: 4,
      subjectId: 7,
      dayOfWeek: 2,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/classes/coverage-stats?schoolId=4&subjectId=7&dayOfWeek=2',
    );
    expect(resultado).toEqual(stats);
  });

  it('getCoverageStats inclui dayOfWeek 0 e omite os demais filtros ausentes', async () => {
    (api.get as any).mockResolvedValue({ data: { data: {} } });

    await indicatorsService.getCoverageStats({ dayOfWeek: 0 });

    expect(api.get).toHaveBeenCalledWith('/classes/coverage-stats?dayOfWeek=0');
  });

  it('getCoverageStats funciona sem nenhum filtro', async () => {
    (api.get as any).mockResolvedValue({ data: { totalClasses: 0 } });

    await expect(indicatorsService.getCoverageStats({})).resolves.toEqual({ totalClasses: 0 });

    expect(api.get).toHaveBeenCalledWith('/classes/coverage-stats?');
  });

  it('getSubjects lê o catálogo global de disciplinas', async () => {
    const subjects = [{ id: 1, name: 'Matemática' }];
    (api.get as any).mockResolvedValue({ data: { data: subjects } });

    await expect(indicatorsService.getSubjects()).resolves.toEqual(subjects);

    expect(api.get).toHaveBeenCalledWith('/subjects');
  });

  it('getSubjects lida com resposta sem envelope', async () => {
    (api.get as any).mockResolvedValue({ data: [{ id: 2, name: 'História' }] });

    await expect(indicatorsService.getSubjects()).resolves.toEqual([{ id: 2, name: 'História' }]);
  });
});
