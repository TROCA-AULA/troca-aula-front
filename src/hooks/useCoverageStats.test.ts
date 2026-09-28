import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCoverageStats } from '@/hooks/useCoverageStats';
import { indicatorsService } from '@/services/indicators.service';
import type { CoverageStats } from '@/types/indicators';

vi.mock('@/services/indicators.service', () => ({
  indicatorsService: {
    getCoverageStats: vi.fn(),
  },
}));

const stats: CoverageStats = {
  totalVagas: 10,
  cobertas: 8,
  taxaCobertura: 0.8,
  nivel: 'baixo',
};

const otherStats: CoverageStats = {
  totalVagas: 4,
  cobertas: 1,
  taxaCobertura: 0.25,
  nivel: 'alto',
};

describe('useCoverageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fica sem indicador quando schoolId não é informado', async () => {
    const { result } = renderHook(() => useCoverageStats());

    expect(result.current.stats).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(indicatorsService.getCoverageStats).not.toHaveBeenCalled();
  });

  it('inicia em loading e carrega o indicador com os filtros informados', async () => {
    let resolveStats!: (value: CoverageStats) => void;
    vi.mocked(indicatorsService.getCoverageStats).mockReturnValue(
      new Promise((resolve) => {
        resolveStats = resolve;
      }),
    );

    const { result } = renderHook(() => useCoverageStats(6, 3, 2));

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
    expect(indicatorsService.getCoverageStats).toHaveBeenCalledWith({
      schoolId: 6,
      subjectId: 3,
      dayOfWeek: 2,
    });

    await act(async () => {
      resolveStats(stats);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.stats).toEqual(stats);
    expect(result.current.error).toBeNull();
  });

  it('busca novamente quando os filtros mudam', async () => {
    vi.mocked(indicatorsService.getCoverageStats)
      .mockResolvedValueOnce(stats)
      .mockResolvedValueOnce(otherStats);

    const { result, rerender } = renderHook(
      ({ subjectId }: { subjectId?: number }) => useCoverageStats(6, subjectId),
      { initialProps: { subjectId: 3 as number | undefined } },
    );

    await waitFor(() => expect(result.current.stats).toEqual(stats));

    rerender({ subjectId: 4 });

    await waitFor(() => expect(result.current.stats).toEqual(otherStats));
    expect(indicatorsService.getCoverageStats).toHaveBeenNthCalledWith(1, {
      schoolId: 6,
      subjectId: 3,
      dayOfWeek: undefined,
    });
    expect(indicatorsService.getCoverageStats).toHaveBeenNthCalledWith(2, {
      schoolId: 6,
      subjectId: 4,
      dayOfWeek: undefined,
    });
  });

  it('limpa o indicador quando schoolId deixa de ser informado', async () => {
    vi.mocked(indicatorsService.getCoverageStats).mockResolvedValue(stats);

    const { result, rerender } = renderHook(
      ({ schoolId }: { schoolId?: number }) => useCoverageStats(schoolId),
      { initialProps: { schoolId: 6 as number | undefined } },
    );

    await waitFor(() => expect(result.current.stats).toEqual(stats));

    rerender({ schoolId: undefined });

    await waitFor(() => expect(result.current.stats).toBeNull());
    expect(result.current.loading).toBe(false);
  });

  it('expõe a mensagem quando o erro é uma instância de Error', async () => {
    vi.mocked(indicatorsService.getCoverageStats).mockRejectedValue(
      new Error('serviço indisponível'),
    );

    const { result } = renderHook(() => useCoverageStats(6));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('serviço indisponível');
    expect(result.current.stats).toBeNull();
  });

  it('usa mensagem padrão quando o erro não é uma instância de Error', async () => {
    vi.mocked(indicatorsService.getCoverageStats).mockRejectedValue('falhou');

    const { result } = renderHook(() => useCoverageStats(6));

    await waitFor(() =>
      expect(result.current.error).toBe('Erro ao carregar indicador'),
    );
    expect(result.current.loading).toBe(false);
  });

  it('ignora a resposta que chega depois do unmount', async () => {
    let resolveStats!: (value: CoverageStats) => void;
    vi.mocked(indicatorsService.getCoverageStats).mockReturnValue(
      new Promise((resolve) => {
        resolveStats = resolve;
      }),
    );

    const { unmount } = renderHook(() => useCoverageStats(6));
    unmount();

    await act(async () => {
      resolveStats(stats);
    });

    // Sem crash nem atualização de estado após o unmount.
    expect(indicatorsService.getCoverageStats).toHaveBeenCalledTimes(1);
  });

  it('ignora o erro que chega depois do unmount', async () => {
    let rejectStats!: (reason: unknown) => void;
    vi.mocked(indicatorsService.getCoverageStats).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectStats = reject;
      }),
    );

    const { unmount } = renderHook(() => useCoverageStats(6));
    unmount();

    await act(async () => {
      rejectStats(new Error('tarde demais'));
    });

    expect(indicatorsService.getCoverageStats).toHaveBeenCalledTimes(1);
  });
});
