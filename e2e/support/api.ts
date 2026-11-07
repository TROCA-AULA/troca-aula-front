import { request, expect, type APIRequestContext } from '@playwright/test';

// Cliente da API do backend, usado só para PREPARAR dados (o que não é o
// foco do teste). O que é testado acontece pela tela.

export const API_URL = `http://localhost:${process.env.E2E_API_PORT ?? 5055}`;
export const MASTER = { email: 'master@trocaaula.local', senha: 'Trocar@123' };
export const SENHA = 'Senha@12345';

export const PERFIL = { DIRETOR: 1, AUXILIAR: 2, PROFESSOR: 3, MASTER: 4 } as const;

/** Sufixo único por teste: os nomes não colidem entre testes nem rodadas. */
export function sufixo(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export class Api {
  private constructor(
    private readonly ctx: APIRequestContext,
    private readonly token: string,
  ) {}

  static async entrar(email: string, senha: string): Promise<Api> {
    const ctx = await request.newContext({ baseURL: API_URL });
    const res = await ctx.post('/auth/login', { data: { email, password: senha } });
    expect(res.ok(), `login de ${email}`).toBeTruthy();
    const { access_token } = await res.json();
    return new Api(ctx, access_token);
  }

  static master(): Promise<Api> {
    return Api.entrar(MASTER.email, MASTER.senha);
  }

  async chamar<T = any>(metodo: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', caminho: string, data?: unknown, esperado?: number): Promise<T> {
    const res = await this.ctx.fetch(caminho, {
      method: metodo,
      headers: { Authorization: `Bearer ${this.token}` },
      ...(data !== undefined ? { data } : {}),
    });
    const corpo = await res.text();
    if (esperado !== undefined) {
      expect(res.status(), `${metodo} ${caminho} → ${corpo.slice(0, 300)}`).toBe(esperado);
    } else {
      expect(res.ok(), `${metodo} ${caminho} → ${res.status()} ${corpo.slice(0, 300)}`).toBeTruthy();
    }
    return (corpo ? JSON.parse(corpo) : undefined) as T;
  }

  async criarRede(nome: string): Promise<number> {
    return (await this.chamar('POST', '/networks', { name: nome })).id;
  }

  async criarEscola(nome: string, networkId: number): Promise<number> {
    return (await this.chamar('POST', '/schools', { name: nome, networkId })).id;
  }

  async criarDisciplina(nome: string): Promise<number> {
    return (await this.chamar('POST', '/subjects', { name: nome })).id;
  }

  async vincular(userId: number, profileId: number, schoolId: number): Promise<void> {
    await this.chamar('POST', `/users/${userId}/assign-profile`, { profileId, schoolId });
  }

  async criarAula(schoolId: number, subjectId: number, criadorId: number, diasAFrente = 1, hora = 10): Promise<number> {
    const { inicio, fim } = horarioAula(diasAFrente, hora);
    const aula = await this.chamar('POST', '/classes', {
      schoolId,
      subjectId,
      createdByd: criadorId,
      statededAt: inicio,
      finishedAt: fim,
    });
    return aula.id;
  }

  async candidatar(classId: number): Promise<number> {
    return (await this.chamar('POST', `/enrollment-requests/request/${classId}`)).id;
  }
}

/** Cadastro público (tela /cadastro), sem token. */
export async function cadastrar(nome: string, email: string, subjectId?: number): Promise<number> {
  const ctx = await request.newContext({ baseURL: API_URL });
  const res = await ctx.post('/users', {
    data: { name: nome, email, phone: '16999990000', password: SENHA, ...(subjectId ? { subjectId } : {}) },
  });
  expect(res.status(), `cadastro de ${email}`).toBe(201);
  const { id } = await res.json();
  await ctx.dispose();
  return id;
}

/** Início/fim de uma aula N dias à frente, em UTC (formato da API). */
export function horarioAula(diasAFrente: number, hora = 10) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + diasAFrente);
  d.setUTCHours(hora, 0, 0, 0);
  const fim = new Date(d.getTime() + 60 * 60 * 1000);
  return { inicio: d.toISOString(), fim: fim.toISOString() };
}

export interface Pessoa {
  id: number;
  nome: string;
  email: string;
}

export interface Cenario {
  s: string;
  master: Api;
  redeId: number;
  rede: string;
  escolaId: number;
  escola: string;
  disciplinaId: number;
  disciplina: string;
  diretora: Pessoa;
  diretoraApi: Api;
  professores: Pessoa[];
}

/**
 * Município + escola + disciplina + diretora + N professores vinculados
 * à escola, todos com nomes únicos. Base da maioria dos testes.
 */
export async function criarCenario(qtdProfessores = 2): Promise<Cenario> {
  const s = sufixo();
  const master = await Api.master();
  const rede = `Município E2E ${s}`;
  const escola = `EMEF E2E ${s}`;
  const disciplina = `Matemática ${s}`;
  const redeId = await master.criarRede(rede);
  const escolaId = await master.criarEscola(escola, redeId);
  const disciplinaId = await master.criarDisciplina(disciplina);

  const diretora: Pessoa = { id: 0, nome: `Diretora Ana ${s}`, email: `diretora.${s}@e2e.local` };
  diretora.id = await cadastrar(diretora.nome, diretora.email);
  await master.vincular(diretora.id, PERFIL.DIRETOR, escolaId);
  const diretoraApi = await Api.entrar(diretora.email, SENHA);

  const nomes = ['Carla', 'Davi', 'Eva', 'Íris', 'Otto'];
  const professores: Pessoa[] = [];
  for (let i = 0; i < qtdProfessores; i++) {
    const p: Pessoa = { id: 0, nome: `Prof. ${nomes[i] ?? i} ${s}`, email: `prof${i + 1}.${s}@e2e.local` };
    p.id = await cadastrar(p.nome, p.email, disciplinaId);
    await diretoraApi.vincular(p.id, PERFIL.PROFESSOR, escolaId);
    professores.push(p);
  }

  return { s, master, redeId, rede, escolaId, escola, disciplinaId, disciplina, diretora, diretoraApi, professores };
}
