'use client';
import { useState, useEffect, useCallback } from 'react';
// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';
import type { EnrollmentRequest } from '@/types/enrollment';

interface SubstitutionLimitState {
  current: number;
  limit: number | null;
  percentage: number;
  canApply: boolean;
  loading: boolean;
  error: string | null;
}

const getCurrentSemester = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month < 6) {
    return `${year}-01-01`;
  }
  return `${year}-07-01`;
};

export const useSubstitutionLimit = (userId?: number | string): SubstitutionLimitState => {
  const [state, setState] = useState<SubstitutionLimitState>({
    current: 0,
    limit: null,
    percentage: 0,
    canApply: true,
    loading: true,
    error: null,
  });

  const fetchUserLimit = useCallback(async (uid: number | string) => {
    try {
      const response = await api.get(`/users/${uid}`);
      const user = response.data?.data ?? response.data;
      return user.substitutionLimitPerSemester ?? null;
    } catch (err) {
      console.error('Error fetching user limit:', err);
      return null;
    }
  }, []);

  const fetchApprovedCount = useCallback(async (uid: number | string) => {
    try {
      const semesterStart = getCurrentSemester();
      const response = await api.get('/enrollment-requests', {
        params: {
          userId: uid,
          status: 'APPROVED',
          createdAfter: semesterStart,
        },
      });
      const enrollments: EnrollmentRequest[] = response.data?.data || response.data || [];
      return enrollments.length;
    } catch (err) {
      console.error('Error fetching approved count:', err);
      return 0;
    }
  }, []);

  const calculatePercentage = useCallback((current: number, limit: number | null): number => {
    if (limit === null || limit === 0) return 0;
    return Math.round((current / limit) * 100);
  }, []);

  const canApply = useCallback((percentage: number, limit: number | null): boolean => {
    if (limit === null) return true;
    return percentage < 100;
  }, []);

  useEffect(() => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const [limit, current] = await Promise.all([
          fetchUserLimit(userId),
          fetchApprovedCount(userId),
        ]);

        const percentage = calculatePercentage(current, limit);
        const canApplyResult = canApply(percentage, limit);

        setState({
          current,
          limit,
          percentage,
          canApply: canApplyResult,
          loading: false,
          error: null,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Erro ao carregar dados',
        }));
      }
    };

    fetchData();
  }, [userId, fetchUserLimit, fetchApprovedCount, calculatePercentage, canApply]);

  return state;
};
