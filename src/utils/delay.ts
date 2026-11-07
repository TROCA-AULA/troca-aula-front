/** Tempo de espera legível: 0 → "na hora"; 45 → "45 min"; 90 → "1h30". */
export function formatDelay(minutes: number): string {
  if (minutes <= 0) return 'na hora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}
