'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { enrollmentService } from '@/services/enrollment.service';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';
import type { Class } from '@/types/enrollment';

// Notificações derivadas dos endpoints que já existem (GET /classes com o
// filtro de matéria/janela de prioridade aplicado pelo servidor e GET
// /enrollment-requests): sem tabela nova, sem job. É o "in-app" do roadmap —
// e-mail/push de verdade continuam na visão de futuro (app mobile).
export type NotificationType =
  | 'NEW_VACANCY'
  | 'ENROLLMENT_DECIDED'
  | 'PENDING_ENROLLMENT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  href: string;
}

const LAST_SEEN_KEY_PREFIX = 'troca-aula:notificationsSeenAt';
// O dropdown não lista eternamente: só o que aconteceu nos últimos 30 dias.
const LOOKBACK_DAYS = 30;
const MAX_ITEMS = 20;

function storageKey(userId?: number): string {
  return `${LAST_SEEN_KEY_PREFIX}:${userId ?? 'anon'}`;
}

function readLastSeen(userId?: number): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

function writeLastSeen(userId: number | undefined, iso: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(userId), iso);
  } catch {
    // localStorage indisponível não é fatal — só perde a marcação de lido.
  }
}

function lookbackStart(): string {
  const date = new Date();
  date.setDate(date.getDate() - LOOKBACK_DAYS);
  return date.toISOString();
}

export function useNotifications() {
  const { user } = useSchoolContext();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = user?.id;
  const profileId = user?.profileId;
  const isProfessor = profileId === PROFILE.PROFESSOR;
  const isMaster = profileId === PROFILE.MASTER;
  // Vaga nova na listagem faz sentido para professor (onde ele se candidata)
  // e para a direção da escola (que acompanha as vagas da própria escola).
  const showsVacancies =
    isProfessor ||
    profileId === PROFILE.DIRETOR ||
    profileId === PROFILE.AUXILIAR_ADMIN;

  // Primeira visita: marca "agora" como visto — não notifica
  // retroativamente todo o histórico. Depois, só o que chegar supera o
  // lastSeen conta como não lido.
  useEffect(() => {
    if (userId === undefined) return;
    const stored = readLastSeen(userId);
    if (stored) {
      setLastSeen(stored);
      return;
    }
    const now = new Date().toISOString();
    writeLastSeen(userId, now);
    setLastSeen(now);
  }, [userId]);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const [classes, enrollments] = await Promise.all([
        showsVacancies
          ? enrollmentService.getAvailableClasses()
          : Promise.resolve([] as Class[]),
        isProfessor
          ? enrollmentService.getEnrollments({ userId: user.id })
          : isMaster
            ? enrollmentService.getEnrollments({ status: 'PENDING' })
            : Promise.resolve([]),
      ]);

      const since = lookbackStart();
      const list: AppNotification[] = [];

      for (const classItem of classes) {
        const createdAt = classItem.createdAt ?? classItem.statededAt;
        if (!createdAt || createdAt < since) continue;
        const description =
          [classItem.subject?.name ?? classItem.subjectName, classItem.school?.name]
            .filter(Boolean)
            .join(' · ') || `Aula #${classItem.id}`;
        list.push({
          id: `class-${classItem.id}`,
          type: 'NEW_VACANCY',
          title: 'Nova aula vaga',
          description,
          createdAt,
          href: isProfessor ? '/classes' : '/dashboard',
        });
      }

      if (isProfessor) {
        for (const enrollment of enrollments) {
          if (enrollment.status !== 'APPROVED' && enrollment.status !== 'REJECTED') {
            continue;
          }
          const createdAt = enrollment.updatedAt ?? enrollment.createdAt;
          if (createdAt < since) continue;
          list.push({
            id: `enrollment-${enrollment.id}`,
            type: 'ENROLLMENT_DECIDED',
            title:
              enrollment.status === 'APPROVED'
                ? 'Candidatura aprovada'
                : 'Candidatura rejeitada',
            description: `Aula #${enrollment.classId}`,
            createdAt,
            href: '/minhas-aulas',
          });
        }
      }

      if (isMaster) {
        for (const enrollment of enrollments) {
          if (enrollment.status !== 'PENDING') continue;
          if (enrollment.createdAt < since) continue;
          list.push({
            id: `pending-${enrollment.id}`,
            type: 'PENDING_ENROLLMENT',
            title: 'Candidatura aguardando aprovação',
            description: `Aula #${enrollment.classId}`,
            createdAt: enrollment.createdAt,
            href: '/master/professores',
          });
        }
      }

      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setItems(list.slice(0, MAX_ITEMS));
    } catch {
      // Sino é conveniência: falha de rede não deve poluir a tela.
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, isProfessor, isMaster, showsVacancies]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const unreadCount = useMemo(
    () => items.filter((item) => (lastSeen ? item.createdAt > lastSeen : false)).length,
    [items, lastSeen],
  );

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    writeLastSeen(userId, now);
    setLastSeen(now);
  }, [userId]);

  return {
    notifications: items,
    unreadCount,
    loading,
    markAllAsRead,
    refetch: fetchItems,
  };
}
