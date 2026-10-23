// EnrollmentStatus/EnrollmentRequest: fonte única em `types/enrollment.ts`
// (backend real, ids numéricos — ver P7 em problemas-conhecidos.md).
export type { EnrollmentStatus, EnrollmentRequest } from './enrollment';
export type { EnrollmentCandidate as TeacherCandidate } from './enrollment';

export interface Subject {
  id: number;
  name: string;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  schoolId?: number | null;
  profileId: number;
  subject?: Subject | null;
  /** Disciplina do professor (Users.subjectId). */
  subjectId?: number | null;
  phone?: string | null;
  /** Limite de substituições por semestre; null = sem limite. */
  substitutionLimitPerSemester?: number | null;
  totalSubstitutions: number;
}

/** Resultado da busca por e-mail (fora da escola vem só o básico). */
export interface TeacherSearchResult {
  id: number;
  name: string;
  email: string;
  subjectId: number | null;
  /** Escolas em que a pessoa já tem vínculo (quando o backend devolve). */
  schoolIds?: number[];
}

export interface UpdateTeacherRequest {
  subjectId?: number;
  substitutionLimitPerSemester?: number | null;
}

export interface LinkTeacherRequest {
  schoolId: number | null;
}

export interface UpdateEnrollmentStatusRequest {
  status: import('./enrollment').EnrollmentStatus;
}
