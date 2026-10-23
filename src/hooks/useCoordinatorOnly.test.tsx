import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCoordinatorOnly } from './useCoordinatorOnly';
import { useOptionalSchoolContext } from '@/contexts/SchoolContext';

vi.mock('@/contexts/SchoolContext', () => ({ useOptionalSchoolContext: vi.fn() }));

describe('useCoordinatorOnly', () => {
  it('false fora do provider', () => {
    vi.mocked(useOptionalSchoolContext).mockReturnValue(undefined);
    expect(renderHook(() => useCoordinatorOnly()).result.current).toBe(false);
  });

  it('true só para coordenador que não é Master', () => {
    vi.mocked(useOptionalSchoolContext).mockReturnValue({
      schoolLinks: [{ schoolId: 1, profileId: 5 }],
    } as any);
    expect(renderHook(() => useCoordinatorOnly()).result.current).toBe(true);

    vi.mocked(useOptionalSchoolContext).mockReturnValue({
      schoolLinks: [
        { schoolId: 1, profileId: 5 },
        { schoolId: 2, profileId: 4 },
      ],
    } as any);
    expect(renderHook(() => useCoordinatorOnly()).result.current).toBe(false);
  });
});
