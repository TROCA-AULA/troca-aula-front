import { describe, it, expect } from 'vitest';
import { workloadBreakdownLabel, workloadTypeName } from './workload';

describe('workloadBreakdownLabel (D17)', () => {
  it('traduz o código do tipo, o id e o total', () => {
    expect(workloadBreakdownLabel('SUPLEMENTAR')).toBe('Carga suplementar');
    expect(workloadBreakdownLabel('1')).toBe('Horas-aula de interação com alunos');
    expect(workloadBreakdownLabel('total')).toBe('Total');
  });

  it('chave desconhecida volta como veio, nunca "Tipo #NaN"', () => {
    expect(workloadBreakdownLabel('OUTRO')).toBe('OUTRO');
    expect(workloadBreakdownLabel('99')).toBe('99');
  });

  it('workloadTypeName segue resolvendo por id', () => {
    expect(workloadTypeName(4)).toBe('Carga suplementar');
    expect(workloadTypeName(42)).toBe('Tipo #42');
  });
});
