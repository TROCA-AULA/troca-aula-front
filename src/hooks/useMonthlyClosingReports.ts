import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { monthlyClosingReportsService } from '@/services/monthly-closing-reports.service';
import type {
  MonthlyClosingReport,
  GenerateMonthlyClosingReportRequest,
} from '@/types/workload';

export function useMonthlyClosingReports(schoolId: number | null, referenceMonth?: string) {
  const [reports, setReports] = useState<MonthlyClosingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await monthlyClosingReportsService.getBySchool(schoolId, referenceMonth);
      setReports(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar relatórios';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, referenceMonth]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const generateReport = async (data: GenerateMonthlyClosingReportRequest) => {
    const report = await monthlyClosingReportsService.generate(data);
    setReports((prev) => {
      const others = prev.filter((r) => r.id !== report.id);
      return [...others, report];
    });
    toast.success('Relatório gerado');
    return report;
  };

  const reviewReport = async (id: number) => {
    const updated = await monthlyClosingReportsService.review(id);
    setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    toast.success('Relatório revisado');
    return updated;
  };

  const closeReport = async (id: number) => {
    const updated = await monthlyClosingReportsService.close(id);
    setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    toast.success('Relatório fechado');
    return updated;
  };

  return { reports, loading, error, generateReport, reviewReport, closeReport, refetch: fetchReports };
}
