// Catálogo global fixo (Design Doc ADR-003) — já definido em
// src/types/master.ts (mesma fonte usada pela tela de WorkloadPolicies) -
// reexportado aqui só por conveniência de import, sem duplicar a lista.
import { WORKLOAD_TYPES } from './master';
export { WORKLOAD_TYPES };

export function workloadTypeName(id: number): string {
  return WORKLOAD_TYPES.find((w) => w.id === id)?.name ?? `Tipo #${id}`;
}

// Rótulo de uma linha do `workloadBreakdown` do fechamento. O backend usa o
// CÓDIGO do tipo como chave ("SUPLEMENTAR"), não o id — converter para
// número dava "Tipo #NaN" (defeito D17).
export function workloadBreakdownLabel(key: string): string {
  if (key === 'total') return 'Total';
  const byCode = WORKLOAD_TYPES.find((w) => w.code === key);
  if (byCode) return byCode.name;
  const id = Number(key);
  if (Number.isInteger(id)) {
    const byId = WORKLOAD_TYPES.find((w) => w.id === id);
    if (byId) return byId.name;
  }
  return key;
}

export interface TeacherWorkloadRecord {
  id: number;
  userId: number;
  schoolId: number;
  networkId: number;
  workloadTypeId: number;
  hours: string;
  ataOficialRef: string | null;
  validFrom: string;
  validTo: string | null;
  createdById: number;
  createdAt: string;
  // Populado só em GET /teacher-workload-records/me (útil quando o
  // professor tem registros em mais de uma escola) - ausente na listagem
  // de gestão por escola, que já é filtrada por schoolId.
  school?: { id: number; name: string };
}

export interface CreateTeacherWorkloadRecordRequest {
  userId: number;
  schoolId: number;
  workloadTypeId: number;
  hours: number;
  validFrom: string;
  validTo?: string;
  ataOficialRef?: string;
  justification?: string;
}

export type MonthlyClosingReportStatus = 'DRAFT' | 'REVIEWED' | 'CLOSED';

export interface MonthlyClosingReport {
  id: number;
  userId: number;
  schoolId: number;
  referenceMonth: string;
  workloadBreakdown: Record<string, number>;
  status: MonthlyClosingReportStatus;
  reviewedById: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface GenerateMonthlyClosingReportRequest {
  userId: number;
  schoolId: number;
  referenceMonth: string;
}
