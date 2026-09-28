// Tipos do indicador estatístico da Fase 4 (Design Doc) — espelham
// CoverageStats do backend (`src/modules/classes/interfaces/coverage-stats.interface.ts`).
export interface CoverageStatsParams {
  schoolId?: number;
  subjectId?: number;
  /** 0 (domingo) a 6 (sábado), mesma convenção do backend. */
  dayOfWeek?: number;
}

export interface CoverageStats {
  totalVagas: number;
  cobertas: number;
  /** 0 a 1; 0 quando não há histórico no recorte. */
  taxaCobertura: number;
  /** Nível de RISCO de não-cobertura (heurística do servidor, não ML). */
  nivel: 'baixo' | 'medio' | 'alto';
}
