import axios from 'axios';

// Resumo de uma linha para log de erro nas rotas do servidor.
// Nunca imprima o erro do axios inteiro: ele carrega o corpo da requisição
// (com a senha, no login) e os headers (com o token de sessão).
export function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const where = `${error.config?.method?.toUpperCase() ?? ''} ${error.config?.url ?? ''}`.trim();
    const what = error.response ? `HTTP ${error.response.status}` : (error.code ?? error.message);
    return where ? `${where} → ${what}` : what;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
