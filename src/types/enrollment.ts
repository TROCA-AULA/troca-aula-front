export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// Candidato denormalizado (nome/email/disciplina/contador). Nenhum endpoint
// real hoje devolve isso embutido em EnrollmentRequest — GET
// /enrollment-requests é flat (ver EnrollmentRequestsRepository.findAll no
// backend). Mantido como campo opcional só para não quebrar telas que já
// esperavam esse formato (ex.: /master/professores) até que o backend
// exponha os dados populados; ver P7 em problemas-conhecidos.md.
export interface EnrollmentCandidate {
  id: number;
  name: string;
  email: string;
  subject?: { id: number; name: string } | null;
  totalSubstitutions: number;
}

export interface EnrollmentRequest {
  id: number;
  classId: number;
  professorId: number;
  userId?: number;
  schoolId?: number;
  status: EnrollmentStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  appliedAt?: string;
  /** Data de aprovação do vínculo do professor na escola da aula
   * (UsersProfilesSchools.approvedAt) — "tempo de casa", populado pelo
   * backend desde a janela de prioridade. */
  schoolSince?: string | null;
  professor?: EnrollmentCandidate;
  user?: EnrollmentCandidate;
}

export interface Class {
  id: number;
  subjectId: number;
  subjectName?: string;
  // Nome real do campo no backend (Drizzle schema `classes.statededAt`) —
  // não existe `date` na API; o typo é intencional lá, preservado aqui para
  // bater com o contrato real (ver Design Doc / P7).
  statededAt: string | null;
  available: boolean;
  schoolId?: number;
  /** Presentes na resposta real (relational query do backend) — usados pelo
   * sino de notificações e pelos indicadores. */
  createdAt?: string;
  finishedAt?: string;
  enrolledById?: number | null;
  enrolledBy?: { id: number; name: string } | null;
  subject?: { id: number; name: string } | null;
  school?: { id: number; name: string } | null;
}

export interface CreateEnrollmentRequest {
  classId: number;
}

export interface EnrollmentListParams {
  professorId?: number;
  userId?: number;
  status?: EnrollmentStatus;
  schoolId?: number;
}

export interface EnrollmentActionResponse {
  data: EnrollmentRequest;
}

export interface EnrollmentListResponse {
  data: EnrollmentRequest[];
}

export interface ApiError {
  message: string;
  code?: string;
}
