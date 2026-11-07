import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildCsv, downloadCsv } from '@/utils/csv';

describe('buildCsv', () => {
  it('começa com BOM, usa ponto e vírgula e CRLF entre linhas', () => {
    expect(buildCsv([['a', 'b'], ['c', 'd']])).toBe('\uFEFF"a";"b"\r\n"c";"d"');
  });

  it('escapa aspas duplicando-as', () => {
    expect(buildCsv([['diz "oi"']])).toBe('\uFEFF"diz ""oi"""');
  });

  it('converte null e undefined em célula vazia', () => {
    expect(buildCsv([[null, undefined]])).toBe('\uFEFF"";""');
  });

  it('converte números em texto', () => {
    expect(buildCsv([[10, 1.5]])).toBe('\uFEFF"10";"1.5"');
  });

  it('preserva string vazia como célula vazia', () => {
    expect(buildCsv([['']])).toBe('\uFEFF""');
  });
});

describe('downloadCsv', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url');
    revokeObjectURL = vi.fn();
    (URL as any).createObjectURL = createObjectURL;
    (URL as any).revokeObjectURL = revokeObjectURL;
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (URL as any).createObjectURL;
    delete (URL as any).revokeObjectURL;
  });

  it('dispara o download do arquivo e limpa os recursos temporários', async () => {
    const linhas = [['Nome', 'Total'], ['Ana', 2], [null, undefined]];
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    downloadCsv('relatorio.csv', linhas);

    // O Blob é criado com o CSV completo (BOM incluso) e com o MIME esperado.
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/csv;charset=utf-8;');
    // Lê os bytes crus preservando o BOM (o .text() do jsdom removeria o BOM).
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const texto = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
    expect(texto).toBe(buildCsv(linhas));

    // O link é anexado, clicado, removido e a URL é revogada.
    const link = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('blob:mock-url');
    expect(link.download).toBe('relatorio.csv');
    expect(appendSpy).toHaveBeenCalledWith(link);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(link);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(document.body.contains(link)).toBe(false);
  });
});
