import type { Tone } from '@/styles/tones';

/** Cor de cada status de candidatura, igual em todas as telas. */
export const ENROLLMENT_TONE: Record<string, Tone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

/** Cor de cada etapa do fechamento mensal. */
export const CLOSING_TONE: Record<string, Tone> = {
  DRAFT: 'primary',
  REVIEWED: 'warning',
  CLOSED: 'success',
};

export function toneOf(map: Record<string, Tone>, status?: string | null): Tone {
  return (status && map[status]) || 'neutral';
}
