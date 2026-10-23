import { describe, it, expect } from 'vitest';
import { CLOSING_TONE, ENROLLMENT_TONE, toneOf } from './status-tones';
import { theme } from '@/styles/theme';

describe('status-tones', () => {
  it('cada status de candidatura tem o seu tom', () => {
    expect(toneOf(ENROLLMENT_TONE, 'PENDING')).toBe('warning');
    expect(toneOf(ENROLLMENT_TONE, 'APPROVED')).toBe('success');
    expect(toneOf(ENROLLMENT_TONE, 'REJECTED')).toBe('danger');
    expect(toneOf(ENROLLMENT_TONE, 'CANCELLED')).toBe('neutral');
  });

  it('cada etapa do fechamento tem o seu tom', () => {
    expect(toneOf(CLOSING_TONE, 'DRAFT')).toBe('primary');
    expect(toneOf(CLOSING_TONE, 'REVIEWED')).toBe('warning');
    expect(toneOf(CLOSING_TONE, 'CLOSED')).toBe('success');
  });

  it('status desconhecido ou vazio fica neutro', () => {
    expect(toneOf(ENROLLMENT_TONE, 'OUTRO')).toBe('neutral');
    expect(toneOf(ENROLLMENT_TONE, null)).toBe('neutral');
  });

  it('todo tom usado existe no tema', () => {
    for (const tone of [...Object.values(ENROLLMENT_TONE), ...Object.values(CLOSING_TONE)]) {
      expect(theme.tones[tone]).toBeDefined();
    }
  });
});
