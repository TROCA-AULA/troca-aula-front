import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMonthlyClosingReports } from '@/hooks/useMonthlyClosingReports';
import { monthlyClosingReportsService } from '@/services/monthly-closing-reports.service';

vi.mock('@/services/monthly-closing-reports.service', () => ({
  monthlyClosingReportsService: {
    getBySchool: vi.fn(),
    generate: vi.fn(),
    review: vi.fn(),
    close: vi.fn(),
    reopen: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const draftReport = {
  id: 1,
  userId: 3,
  schoolId: 1,
  referenceMonth: '2026-10',
  workloadBreakdown: { AULA: 20, total: 20 },
  status: 'DRAFT' as const,
  reviewedById: null,
  reviewedAt: null,
  createdAt: '2026-10-01',
};

describe('useMonthlyClosingReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads reports for the given school', async () => {
    vi.mocked(monthlyClosingReportsService.getBySchool).mockResolvedValue([draftReport]);

    const { result } = renderHook(() => useMonthlyClosingReports(1));

    await waitFor(() => expect(result.current.reports).toEqual([draftReport]));
  });

  it('generates a report and upserts it into state', async () => {
    vi.mocked(monthlyClosingReportsService.getBySchool).mockResolvedValue([]);
    vi.mocked(monthlyClosingReportsService.generate).mockResolvedValue(draftReport);

    const { result } = renderHook(() => useMonthlyClosingReports(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generateReport({ userId: 3, schoolId: 1, referenceMonth: '2026-10' });
    });

    expect(result.current.reports).toEqual([draftReport]);
  });

  it('reviews a report, updating its status in place', async () => {
    vi.mocked(monthlyClosingReportsService.getBySchool).mockResolvedValue([draftReport]);
    const reviewed = { ...draftReport, status: 'REVIEWED' as const };
    vi.mocked(monthlyClosingReportsService.review).mockResolvedValue(reviewed);

    const { result } = renderHook(() => useMonthlyClosingReports(1));
    await waitFor(() => expect(result.current.reports).toHaveLength(1));

    await act(async () => {
      await result.current.reviewReport(1);
    });

    expect(result.current.reports[0].status).toBe('REVIEWED');
  });

  it('closes a report, updating its status in place', async () => {
    const reviewed = { ...draftReport, status: 'REVIEWED' as const };
    vi.mocked(monthlyClosingReportsService.getBySchool).mockResolvedValue([reviewed]);
    const closed = { ...reviewed, status: 'CLOSED' as const };
    vi.mocked(monthlyClosingReportsService.close).mockResolvedValue(closed);

    const { result } = renderHook(() => useMonthlyClosingReports(1));
    await waitFor(() => expect(result.current.reports).toHaveLength(1));

    await act(async () => {
      await result.current.closeReport(1);
    });

    expect(result.current.reports[0].status).toBe('CLOSED');
  });

  it('reopens a reviewed/closed report back to DRAFT with the justification', async () => {
    const closed = { ...draftReport, status: 'CLOSED' as const };
    vi.mocked(monthlyClosingReportsService.getBySchool).mockResolvedValue([closed]);
    vi.mocked(monthlyClosingReportsService.reopen).mockResolvedValue(draftReport);

    const { result } = renderHook(() => useMonthlyClosingReports(1));
    await waitFor(() => expect(result.current.reports).toHaveLength(1));

    await act(async () => {
      await result.current.reopenReport(1, 'Horas lançadas em duplicidade');
    });

    expect(monthlyClosingReportsService.reopen).toHaveBeenCalledWith(
      1,
      'Horas lançadas em duplicidade',
    );
    expect(result.current.reports[0].status).toBe('DRAFT');
  });
});
