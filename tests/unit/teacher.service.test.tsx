import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherService } from '../../src/services/teacher.service';
import { PROFILE } from '../../src/constants/profile';

vi.mock('../../src/api-client.service', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn(),
      },
    },
  },
}));

import apiService from '../../src/api-client.service';

const mockApi = apiService as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

describe('teacherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLinkedTeachers', () => {
    it('should return list of teachers linked to a school', async () => {
      // Shape real do backend: cada usuário traz `upsUser` (vínculos), não
      // campos planos schoolId/profileId — teacherService achata isso.
      const mockRaw = [
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@escola.com',
          subject: { id: 'subj-1', name: 'Matemática' },
          totalSubstitutions: 15,
          upsUser: [{ schoolId: 1, profileId: PROFILE.PROFESSOR }],
        },
      ];
      mockApi.get = vi.fn().mockResolvedValue({ data: mockRaw });

      const result = await teacherService.getLinkedTeachers(1);

      expect(mockApi.get).toHaveBeenCalledWith('/users', {
        params: { schoolId: 1, profileId: PROFILE.PROFESSOR },
      });
      expect(result).toEqual([
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@escola.com',
          schoolId: 1,
          profileId: PROFILE.PROFESSOR,
          subject: { id: 'subj-1', name: 'Matemática' },
          totalSubstitutions: 15,
        },
      ]);
    });

    it('should return empty array when no teachers are linked', async () => {
      mockApi.get = vi.fn().mockResolvedValue({ data: [] });

      const result = await teacherService.getLinkedTeachers(1);

      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      mockApi.get = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(teacherService.getLinkedTeachers(1)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getAvailableTeachers', () => {
    it('should return teachers not linked to the given school', async () => {
      const mockRaw = [
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@email.com',
          subject: { id: 'subj-2', name: 'Física' },
          totalSubstitutions: 8,
          upsUser: [], // sem nenhum vínculo ainda
        },
        {
          id: 3,
          name: 'Pedro Oliveira',
          email: 'pedro@email.com',
          subject: { id: 'subj-3', name: 'Química' },
          totalSubstitutions: 12,
          upsUser: [{ schoolId: 2, profileId: PROFILE.PROFESSOR }], // vinculado a OUTRA escola
        },
      ];
      mockApi.get = vi.fn().mockResolvedValue({ data: mockRaw });

      const result = await teacherService.getAvailableTeachers(1);

      expect(mockApi.get).toHaveBeenCalledWith('/users', {
        params: { profileId: PROFILE.PROFESSOR },
      });
      expect(result.map((t) => t.id)).toEqual([2, 3]);
    });

    it('should exclude teachers already linked to this school', async () => {
      const mockRaw = [
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@escola.com',
          totalSubstitutions: 15,
          upsUser: [{ schoolId: 1, profileId: PROFILE.PROFESSOR }],
        },
      ];
      mockApi.get = vi.fn().mockResolvedValue({ data: mockRaw });

      const result = await teacherService.getAvailableTeachers(1);

      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      mockApi.get = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(teacherService.getAvailableTeachers(1)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('linkTeacher', () => {
    it('should call assign-profile with PROFESSOR role', async () => {
      mockApi.post = vi.fn().mockResolvedValue({ data: {} });

      await teacherService.linkTeacher(1, 1);

      expect(mockApi.post).toHaveBeenCalledWith('/users/1/assign-profile', {
        profileId: PROFILE.PROFESSOR,
        schoolId: 1,
      });
    });

    it('should throw error when user not found', async () => {
      mockApi.post = vi.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'User not found' } },
      });

      await expect(
        teacherService.linkTeacher(999, 1)
      ).rejects.toThrow();
    });
  });

  describe('unlinkTeacher', () => {
    it('should call unassign-profile with PROFESSOR role', async () => {
      mockApi.post = vi.fn().mockResolvedValue({ data: {} });

      await teacherService.unlinkTeacher(1, 1);

      expect(mockApi.post).toHaveBeenCalledWith('/users/1/unassign-profile', {
        profileId: PROFILE.PROFESSOR,
        schoolId: 1,
      });
    });

    it('should throw error when API call fails', async () => {
      mockApi.post = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(teacherService.unlinkTeacher(1, 1)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getEnrollmentRequests', () => {
    it('should return enrollment requests for a school', async () => {
      const mockEnrollments = [
        {
          id: 'enr-1',
          userId: 'user-1',
          schoolId: 'school-1',
          status: 'PENDING',
          appliedAt: '2026-05-17T10:00:00Z',
          user: {
            id: 'user-1',
            name: 'Maria Santos',
            email: 'maria@email.com',
            subject: { id: 'subj-2', name: 'Física' },
            totalSubstitutions: 8,
          },
        },
      ];
      mockApi.get = vi.fn().mockResolvedValue({ data: mockEnrollments });

      const result = await teacherService.getEnrollmentRequests(1);

      // A escola não vai mais na query: o backend deriva do token do gestor
      // autenticado (P15/P16). O parâmetro `schoolId` da assinatura é só
      // para compatibilidade com os chamadores.
      expect(mockApi.get).toHaveBeenCalledWith('/enrollment-requests', {
        params: {},
      });
      expect(result).toEqual(mockEnrollments);
    });

    it('should filter by status when provided', async () => {
      mockApi.get = vi.fn().mockResolvedValue({ data: [] });

      await teacherService.getEnrollmentRequests(1, 'PENDING');

      expect(mockApi.get).toHaveBeenCalledWith('/enrollment-requests', {
        params: { status: 'PENDING' },
      });
    });

    it('should throw error when API call fails', async () => {
      mockApi.get = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        teacherService.getEnrollmentRequests(1)
      ).rejects.toThrow('Network error');
    });
  });

  describe('updateEnrollmentStatus', () => {
    it('should approve an enrollment request', async () => {
      const mockResponse = {
        id: 'enr-1',
        userId: 'user-1',
        schoolId: 'school-1',
        status: 'APPROVED',
        appliedAt: '2026-05-17T10:00:00Z',
      };
      mockApi.patch = vi.fn().mockResolvedValue({ data: mockResponse });

      const result = await teacherService.updateEnrollmentStatus(
        1,
        'APPROVED'
      );

      expect(mockApi.patch).toHaveBeenCalledWith(
        '/enrollment-requests/1/approve'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should reject an enrollment request', async () => {
      const mockResponse = {
        id: 'enr-1',
        userId: 'user-1',
        schoolId: 'school-1',
        status: 'REJECTED',
        appliedAt: '2026-05-17T10:00:00Z',
      };
      mockApi.patch = vi.fn().mockResolvedValue({ data: mockResponse });

      const result = await teacherService.updateEnrollmentStatus(
        1,
        'REJECTED'
      );

      expect(mockApi.patch).toHaveBeenCalledWith(
        '/enrollment-requests/1/reject'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when enrollment not found', async () => {
      mockApi.patch = vi.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Enrollment not found' } },
      });

      await expect(
        teacherService.updateEnrollmentStatus(999, 'APPROVED')
      ).rejects.toThrow();
    });
  });
});
