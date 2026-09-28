// Exportação CSV (abre no Excel/Google Sheets): separador `;` e BOM UTF-8,
// que é o que o Excel pt-BR espera para reconhecer acentuação e colunas.
export type CsvValue = string | number | null | undefined;

function escapeCsvValue(value: CsvValue): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(rows: CsvValue[][]): string {
  return '\uFEFF' + rows.map((row) => row.map(escapeCsvValue).join(';')).join('\r\n');
}

export function downloadCsv(filename: string, rows: CsvValue[][]) {
  const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
