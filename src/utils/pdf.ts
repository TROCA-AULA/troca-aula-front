// Exportação PDF nativa no cliente (jsPDF), complementando o CSV e a
// impressão do navegador. Importada dinamicamente para não pesar no bundle
// inicial e não atrapalhar o SSR/testes.

export interface PdfTableData {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  /** Rodapé livre (ex.: nome da escola e data de geração). */
  footer?: string;
}

const MARGIN = 40;
const ROW_HEIGHT = 20;

export async function downloadPdfTable(
  filename: string,
  data: PdfTableData,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const tableWidth = pageWidth - MARGIN * 2;
  const columnWidth = tableWidth / Math.max(data.headers.length, 1);

  const drawHeader = (y: number): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    data.headers.forEach((header, index) => {
      doc.text(
        doc.splitTextToSize(header, columnWidth - 8)[0] ?? '',
        MARGIN + index * columnWidth + 4,
        y + 14,
      );
    });
    doc.setDrawColor(200);
    doc.line(MARGIN, y + ROW_HEIGHT, MARGIN + tableWidth, y + ROW_HEIGHT);
    return y + ROW_HEIGHT;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(data.title, MARGIN, MARGIN + 8);
  let y = MARGIN + 28;

  if (data.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(data.subtitle, MARGIN, y);
    doc.setTextColor(0);
    y += 18;
  }

  y = drawHeader(y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const row of data.rows) {
    if (y + ROW_HEIGHT > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
      y = drawHeader(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }
    row.forEach((cell, index) => {
      const text =
        doc.splitTextToSize(String(cell ?? ''), columnWidth - 8)[0] ?? '';
      doc.text(text, MARGIN + index * columnWidth + 4, y + 14);
    });
    doc.setDrawColor(240);
    doc.line(MARGIN, y + ROW_HEIGHT, MARGIN + tableWidth, y + ROW_HEIGHT);
    y += ROW_HEIGHT;
  }

  if (data.footer) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(data.footer, MARGIN, pageHeight - 20);
  }

  doc.save(filename);
}
