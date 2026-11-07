import { describe, it, expect } from 'vitest';
import { formatDateOnly } from './date';

describe('formatDateOnly (D16)', () => {
  it('mostra o mesmo dia que foi gravado, sem fuso', () => {
    expect(formatDateOnly('2026-10-01')).toBe('01/10/2026');
    expect(formatDateOnly('2026-10-01T00:00:00.000Z')).toBe('01/10/2026');
  });

  it('vazio vira texto vazio; formato estranho volta como veio', () => {
    expect(formatDateOnly(null)).toBe('');
    expect(formatDateOnly(undefined)).toBe('');
    expect(formatDateOnly('ontem')).toBe('ontem');
  });
});
