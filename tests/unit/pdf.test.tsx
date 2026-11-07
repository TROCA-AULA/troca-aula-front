import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadPdfTable } from '@/utils/pdf';

// jsPDF real não roda bem no JSDOM; mockamos a API usada pelo helper e
// verificamos o conteúdo gerado (título, cabeçalhos, linhas e save).
const textCalls: string[] = [];
const linesAdded: string[] = [];
let pages = 1;
const saveMock = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: class {
    internal = {
      pageSize: {
        getWidth: () => 595,
        getHeight: () => 842,
      },
    };
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    splitTextToSize = (text: string) => [String(text)];
    text = (text: string) => {
      textCalls.push(text);
    };
    line = () => {
      linesAdded.push('line');
    };
    addPage = () => {
      pages += 1;
    };
    save = saveMock;
  },
}));

describe('downloadPdfTable', () => {
  beforeEach(() => {
    textCalls.length = 0;
    linesAdded.length = 0;
    pages = 1;
    vi.clearAllMocks();
  });

  it('gera o PDF com título, subtítulo, cabeçalhos e linhas', async () => {
    await downloadPdfTable('relatorio.pdf', {
      title: 'Indicadores — Escola #4',
      subtitle: 'Aulas vagas: 10',
      headers: ['Professor', 'Aula'],
      rows: [['Maria', '#42']],
      footer: 'Gerado agora',
    });

    expect(textCalls).toContain('Indicadores — Escola #4');
    expect(textCalls).toContain('Aulas vagas: 10');
    expect(textCalls).toContain('Professor');
    expect(textCalls).toContain('Maria');
    expect(textCalls).toContain('#42');
    expect(saveMock).toHaveBeenCalledWith('relatorio.pdf');
    expect(linesAdded.length).toBeGreaterThan(0);
  });

  it('adiciona página quando as linhas passam do fim da página', async () => {
    const rows = Array.from({ length: 80 }, (_, i) => [`Linha ${i}`, '#1']);
    await downloadPdfTable('longo.pdf', {
      title: 'Relatório longo',
      headers: ['A', 'B'],
      rows,
    });

    expect(pages).toBeGreaterThan(1);
  });
});
