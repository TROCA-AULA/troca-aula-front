// Catálogo global fixo (Design Doc ADR-003) — já definido em
// src/types/master.ts (mesma fonte usada pela tela de WorkloadPolicies) -
// reexportado aqui só por conveniência de import, sem duplicar a lista.
import { WORKLOAD_TYPES } from './master';
export { WORKLOAD_TYPES };

export function workloadTypeName(id: number): string {
  return WORKLOAD_TYPES.find((w) => w.id === id)?.name ?? `Tipo #${id}`;
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
