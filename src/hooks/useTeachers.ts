'use client';

import { useState, useEffect, useCallback } from 'react';
import { teacherService } from '@/services/teacher.service';
import { Teacher, EnrollmentRequest } from '@/types/teacher';

interface UseTeachersReturn {
  linkedTeachers: Teacher[];
  availableTeachers: Teacher[];
  enrollmentRequests: EnrollmentRequest[];
  loading: boolean;
  error: string | null;
  fetchLinkedTeachers: () => Promise<void>;
  fetchAvailableTeachers: () => Promise<void>;
  fetchEnrollmentRequests: (status?: string) => Promise<void>;
  linkTeacher: (userId: string, schoolId: string) => Promise<void>;
  unlinkTeacher: (userId: string) => Promise<void>;
  updateEnrollmentStatus: (
    enrollmentId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => Promise<void>;
}

export function useTeachers(schoolId: string): UseTeachersReturn {
  const [linkedTeachers, setLinkedTeachers] = useState<Teacher[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<
    EnrollmentRequest[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinkedTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherService.getLinkedTeachers(schoolId);
      setLinkedTeachers(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch linked teachers';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchAvailableTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherService.getAvailableTeachers(schoolId);
      setAvailableTeachers(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch available teachers';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchEnrollmentRequests = useCallback(
    async (status?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await teacherService.getEnrollmentRequests(
          schoolId,
          status
        );
        setEnrollmentRequests(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to fetch enrollment requests';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [schoolId]
  );

  const linkTeacher = useCallback(
    async (userId: string, schoolId: string) => {
      setLoading(true);
      setError(null);
      try {
        await teacherService.linkTeacher(userId, schoolId);
        await fetchLinkedTeachers();
        await fetchAvailableTeachers();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to link teacher';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [fetchLinkedTeachers, fetchAvailableTeachers]
  );

  const unlinkTeacher = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);
      try {
        await teacherService.unlinkTeacher(userId, schoolId);
        await fetchLinkedTeachers();
        await fetchAvailableTeachers();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to unlink teacher';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [schoolId, fetchLinkedTeachers, fetchAvailableTeachers]
  );

  const updateEnrollmentStatus = useCallback(
    async (
      enrollmentId: string,
      status: 'APPROVED' | 'REJECTED'
    ) => {
      setLoading(true);
      setError(null);
      try {
        await teacherService.updateEnrollmentStatus(enrollmentId, status);
        await fetchEnrollmentRequests();
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to update enrollment status';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [fetchEnrollmentRequests]
  );

  useEffect(() => {
    if (schoolId) {
      fetchLinkedTeachers();
    }
  }, [schoolId, fetchLinkedTeachers]);

  return {
    linkedTeachers,
    availableTeachers,
    enrollmentRequests,
    loading,
    error,
    fetchLinkedTeachers,
    fetchAvailableTeachers,
    fetchEnrollmentRequests,
    linkTeacher,
    unlinkTeacher,
    updateEnrollmentStatus,
  };
}

export default useTeachers;
