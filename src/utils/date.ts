// Datas "só de dia" (colunas `date` do banco, ex.: vigência da jornada)
// chegam como "2026-10-01". `new Date("2026-10-01")` é meia-noite em UTC,
// que no Brasil (UTC-3) ainda é 30/09 — por isso apareciam 1 dia antes
// (defeito D16). Aqui a data é lida como texto, sem fuso.
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
