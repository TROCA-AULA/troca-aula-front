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
  totalSubstitutions: number;
}

export interface LinkTeacherRequest {
  schoolId: number | null;
}

export interface UpdateEnrollmentStatusRequest {
  status: import('./enrollment').EnrollmentStatus;
}
