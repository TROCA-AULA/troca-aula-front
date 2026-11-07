import { describe, it, expect } from 'vitest';
import { formatDelay } from './delay';

describe('formatDelay', () => {
  it('formata minutos e horas', () => {
    expect(formatDelay(0)).toBe('na hora');
    expect(formatDelay(-5)).toBe('na hora');
    expect(formatDelay(45)).toBe('45 min');
    expect(formatDelay(60)).toBe('1h');
    expect(formatDelay(90)).toBe('1h30');
    expect(formatDelay(125)).toBe('2h05');
  });
});
