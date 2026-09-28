import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubjects } from '@/hooks/useSubjects';
import { indicatorsService } from '@/services/indicators.service';

vi.mock('@/services/indicators.service', () => ({
  indicatorsService: {
    getSubjects: vi.fn(),
  },
}));

describe('useSubjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega o catálogo de disciplinas', async () => {
    vi.mocked(indicatorsService.getSubjects).mockResolvedValue([
      { id: 1, name: 'Matemática' },
    ]);

    const { result } = renderHook(() => useSubjects());

    await waitFor(() => expect(result.current.subjects).toHaveLength(1));
    expect(result.current.subjects[0].name).toBe('Matemática');
  });

  it('cai para lista vazia quando o catálogo falha (filtro é conveniência)', async () => {
    vi.mocked(indicatorsService.getSubjects).mockRejectedValue(new Error('erro'));

    const { result } = renderHook(() => useSubjects());

    await waitFor(() => expect(result.current.subjects).toEqual([]));
  });
});
