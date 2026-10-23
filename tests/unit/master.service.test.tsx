import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { masterService, generateTempPassword } from '@/services/master.service';
import api from '@/api-client.service';

vi.mock('@/api-client.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('masterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSchools/getUsers usam os endpoints com filtros', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    await masterService.getSchools();
    await masterService.getUsers(3, 1);

    expect(api.get).toHaveBeenCalledWith('/schools');
    expect(api.get).toHaveBeenCalledWith('/users?profileId=3&schoolId=1');
  });

  it('createUser cria em um passo (o vínculo é feito à parte via assign-profile)', async () => {
    (api.post as any).mockResolvedValue({ data: { id: 9 } });

    await masterService.createUser({
      name: 'Novo Diretor',
      email: 'd@e.com',
      phone: '1',
      password: 'senha123',
    } as any);

    expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({ email: 'd@e.com' }));
  });

  it('getAuditLogByNetwork consulta a auditoria por rede', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    await masterService.getAuditLogByNetwork(5);

    expect(api.get).toHaveBeenCalledWith('/audit-log/network/5');
  });

  it('getDashboardStats agrega escolas, aulas vagas e substituições do mês', async () => {
    const thisMonth = new Date().toISOString();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/schools') return Promise.resolve({ data: [{ id: 1 }, { id: 2 }] });
      if (url === '/classes?available=true')
        return Promise.resolve({ data: [{ id: 1 }] });
      if (url.startsWith('/enrollment-requests'))
        return Promise.resolve({
          data: [
            { id: 1, createdAt: thisMonth },
            { id: 2, createdAt: thisMonth },
            { id: 3, createdAt: thisMonth },
          ],
        });
      return Promise.resolve({ data: [] });
    });

    const stats = await masterService.getDashboardStats();

    expect(stats.totalSchools).toBe(2);
    expect(stats.totalClassesAvailable).toBe(1);
    expect(stats.totalSubstitutionsThisMonth).toBe(3);
  });

  it('getSchool busca a escola pelo id (com e sem envelope)', async () => {
    (api.get as any).mockResolvedValueOnce({ data: { data: { id: 4, name: 'Escola A' } } });

    await expect(masterService.getSchool(4)).resolves.toEqual({ id: 4, name: 'Escola A' });

    (api.get as any).mockResolvedValueOnce({ data: { id: 5, name: 'Escola B' } });

    await expect(masterService.getSchool(5)).resolves.toEqual({ id: 5, name: 'Escola B' });

    expect(api.get).toHaveBeenNthCalledWith(1, '/schools/4');
    expect(api.get).toHaveBeenNthCalledWith(2, '/schools/5');
  });

  it('gerencia redes: listar, criar e atualizar', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [{ id: 1, name: 'Rede' }] } });
    (api.post as any).mockResolvedValue({ data: { data: { id: 1, name: 'Rede' } } });
    (api.patch as any).mockResolvedValue({ data: { data: { id: 1, name: 'Rede 2' } } });

    await expect(masterService.getNetworks()).resolves.toEqual([{ id: 1, name: 'Rede' }]);
    await masterService.createNetwork({ name: 'Rede' } as any);
    await masterService.updateNetwork(1, { name: 'Rede 2' } as any);

    expect(api.get).toHaveBeenCalledWith('/networks');
    expect(api.post).toHaveBeenCalledWith('/networks', { name: 'Rede' });
    expect(api.patch).toHaveBeenCalledWith('/networks/1', { name: 'Rede 2' });
  });

  it('lista políticas de carga horária com e sem filtro de rede', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [] } });

    await masterService.getWorkloadPolicies();
    await masterService.getWorkloadPolicies(3);

    expect(api.get).toHaveBeenNthCalledWith(1, '/workload-policies');
    expect(api.get).toHaveBeenNthCalledWith(2, '/workload-policies?networkId=3');
  });

  it('cria e atualiza políticas de carga horária', async () => {
    (api.post as any).mockResolvedValue({ data: { data: { id: 2 } } });
    (api.patch as any).mockResolvedValue({ data: { data: { id: 2 } } });

    await masterService.createWorkloadPolicy({ name: 'Padrão' } as any);
    await masterService.updateWorkloadPolicy(2, { name: 'Nova' } as any);

    expect(api.post).toHaveBeenCalledWith('/workload-policies', { name: 'Padrão' });
    expect(api.patch).toHaveBeenCalledWith('/workload-policies/2', { name: 'Nova' });
  });

  it('cria, atualiza e remove escolas', async () => {
    (api.post as any).mockResolvedValue({ data: { data: { id: 8 } } });
    (api.patch as any).mockResolvedValue({ data: { data: { id: 8 } } });
    (api.delete as any).mockResolvedValue({ data: {} });

    await masterService.createSchool({ name: 'Escola Nova' } as any);
    await masterService.updateSchool(8, { name: 'Escola Editada' } as any);
    await masterService.deleteSchool(8);

    expect(api.post).toHaveBeenCalledWith('/schools', { name: 'Escola Nova' });
    expect(api.patch).toHaveBeenCalledWith('/schools/8', { name: 'Escola Editada' });
    expect(api.delete).toHaveBeenCalledWith('/schools/8');
  });

  it('getUsers achata o vínculo que bate com os filtros de perfil e escola', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Diretor',
            email: 'd@e.com',
            phone: null,
            createdAt: '2026-01-01',
            upsUser: [
              { schoolId: 9, profileId: 1 },
              { schoolId: 4, profileId: 1 },
            ],
          },
          {
            id: 2,
            name: 'Sem vínculo',
            email: 's@e.com',
            phone: '1199',
            createdAt: '2026-01-02',
            upsUser: [],
          },
          {
            id: 3,
            name: 'Sem upsUser',
            email: 'x@e.com',
            phone: null,
            createdAt: '2026-01-03',
          },
        ],
      },
    });

    const usuarios = await masterService.getUsers(1, 4);

    expect(api.get).toHaveBeenCalledWith('/users?profileId=1&schoolId=4');
    expect(usuarios[0]).toMatchObject({ id: 1, schoolId: 4, profileId: 1, phone: null });
    expect(usuarios[1]).toMatchObject({ id: 2, schoolId: null, profileId: 0, phone: '1199' });
    expect(usuarios[2]).toMatchObject({ id: 3, schoolId: null, profileId: 0 });
  });

  it('getUsers usa o primeiro vínculo quando nenhum bate com o filtro', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: 'A',
            email: 'a@e.com',
            phone: null,
            createdAt: '2026-01-01',
            upsUser: [{ schoolId: 9, profileId: 2 }],
          },
        ],
      },
    });

    const usuarios = await masterService.getUsers(1, 4);

    expect(usuarios[0]).toMatchObject({ schoolId: 9, profileId: 2 });
  });

  it('getUsers aceita filtros parciais e resposta sem envelope', async () => {
    (api.get as any).mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'A',
          email: 'a@e.com',
          phone: '1',
          createdAt: '2026-01-01',
          upsUser: [{ schoolId: 2, profileId: 2 }],
        },
      ],
    });

    const usuarios = await masterService.getUsers(undefined, 2);

    expect(api.get).toHaveBeenCalledWith('/users?schoolId=2');
    expect(usuarios[0]).toMatchObject({ schoolId: 2, profileId: 2 });
  });

  it('getUsers sem filtros consulta a rota sem query e achata o primeiro vínculo', async () => {
    (api.get as any).mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'A',
          email: 'a@e.com',
          phone: '1',
          createdAt: '2026-01-01',
          upsUser: [{ schoolId: 7, profileId: 3 }],
        },
      ],
    });

    const usuarios = await masterService.getUsers();

    expect(api.get).toHaveBeenCalledWith('/users?');
    expect(usuarios[0]).toMatchObject({ schoolId: 7, profileId: 3 });
  });

  it('createUser gera senha temporária, cria e vincula o perfil', async () => {
    (api.post as any).mockImplementation((url: string) => {
      if (url === '/users') {
        return Promise.resolve({
          data: {
            data: {
              id: 12,
              name: 'Novo Diretor',
              email: 'novo@e.com',
              phone: null,
              createdAt: '2026-01-04',
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const criado = await masterService.createUser({
      name: 'Novo Diretor',
      email: 'novo@e.com',
      phone: '1199',
      profileId: 3,
      schoolId: 2,
    } as any);

    expect(api.post).toHaveBeenNthCalledWith(1, '/users', {
      name: 'Novo Diretor',
      email: 'novo@e.com',
      phone: '1199',
      password: criado.tempPassword,
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/users/12/assign-profile', {
      profileId: 3,
      schoolId: 2,
    });
    expect(api.post).toHaveBeenNthCalledWith(3, '/users/12/reset-password');
    expect(criado.tempPassword).toMatch(/^[A-Za-z0-9]{1,12}$/);
    expect(criado).toMatchObject({
      id: 12,
      name: 'Novo Diretor',
      email: 'novo@e.com',
      phone: null,
      schoolId: 2,
      profileId: 3,
      createdAt: '2026-01-04',
    });
  });

  it('createUser usa o corpo direto quando não há envelope', async () => {
    (api.post as any).mockImplementation((url: string) =>
      url === '/users'
        ? Promise.resolve({
            data: {
              id: 13,
              name: 'Professor',
              email: 'p@e.com',
              phone: '9888',
              createdAt: '2026-01-05',
            },
          })
        : Promise.resolve({ data: {} }),
    );

    const criado = await masterService.createUser({
      name: 'Professor',
      email: 'p@e.com',
      phone: '9888',
      profileId: 3,
      schoolId: 2,
    } as any);

    expect(criado).toMatchObject({ id: 13, phone: '9888', schoolId: 2, profileId: 3 });
    // O gerador (9 bytes → base64 sem +/=) varia de tamanho; o contrato é alfanumérico até 12.
    expect(criado.tempPassword).toMatch(/^[A-Za-z0-9]{1,12}$/);
  });

  it('createUser gera senha pelo fallback quando getRandomValues não existe', async () => {
    vi.stubGlobal('crypto', {});
    (api.post as any).mockResolvedValue({ data: { id: 14, name: 'X', email: 'x@e.com', phone: null, createdAt: 'z' } });

    const criado = await masterService.createUser({
      name: 'X',
      email: 'x@e.com',
      phone: '1',
      profileId: 3,
      schoolId: 2,
    } as any);

    expect(criado.tempPassword).toMatch(/^[A-Za-z0-9]{1,12}$/);
  });

  it('createUser gera senha sem o objeto global crypto', async () => {
    vi.stubGlobal('crypto', undefined);
    (api.post as any).mockResolvedValue({ data: { id: 15, name: 'Y', email: 'y@e.com', phone: null, createdAt: 'z' } });

    const criado = await masterService.createUser({
      name: 'Y',
      email: 'y@e.com',
      phone: '1',
      profileId: 3,
      schoolId: 2,
    } as any);

    expect(criado.tempPassword).toMatch(/^[A-Za-z0-9]{1,12}$/);
  });

  it('createUser explica que o usuário ficou sem vínculo quando assign-profile falha', async () => {
    (api.post as any)
      .mockResolvedValueOnce({
        data: { id: 12, name: 'Novo Diretor', email: 'novo@e.com', phone: null, createdAt: 'x' },
      })
      .mockRejectedValueOnce(new Error('409 conflito'));

    await expect(
      masterService.createUser({
        name: 'Novo Diretor',
        email: 'novo@e.com',
        phone: '1',
        profileId: 3,
        schoolId: 2,
      } as any),
    ).rejects.toThrow(
      'Usuário "Novo Diretor" foi criado, mas o vínculo com a escola falhou (409 conflito). Peça a outro administrador para vinculá-lo manualmente.',
    );
  });

  it('createUser trata rejeição que não é Error como erro desconhecido', async () => {
    (api.post as any)
      .mockResolvedValueOnce({
        data: { id: 12, name: 'Novo', email: 'n@e.com', phone: null, createdAt: 'x' },
      })
      .mockRejectedValueOnce('falha opaca');

    await expect(
      masterService.createUser({
        name: 'Novo',
        email: 'n@e.com',
        phone: '1',
        profileId: 3,
        schoolId: 2,
      } as any),
    ).rejects.toThrow(/vínculo com a escola falhou \(erro desconhecido\)/);
  });

  it('updateUser e unlinkUser usam PATCH e unassign-profile', async () => {
    (api.patch as any).mockResolvedValue({ data: { data: { id: 5, name: 'Editado' } } });
    (api.post as any).mockResolvedValue({ data: {} });

    await expect(masterService.updateUser(5, { name: 'Editado' })).resolves.toEqual({
      id: 5,
      name: 'Editado',
    });
    await masterService.unlinkUser(5, 2, 9);

    expect(api.patch).toHaveBeenCalledWith('/users/5', { name: 'Editado' });
    expect(api.post).toHaveBeenCalledWith('/users/5/unassign-profile', {
      profileId: 2,
      schoolId: 9,
    });
  });

  it('usa o corpo direto quando a API não devolve envelope (redes, políticas, escolas e usuários)', async () => {
    (api.get as any).mockResolvedValue({ data: { id: 1 } });
    (api.post as any).mockResolvedValue({ data: { id: 1 } });
    (api.patch as any).mockResolvedValue({ data: { id: 1 } });

    await expect(masterService.getNetworks()).resolves.toEqual({ id: 1 });
    await expect(masterService.createNetwork({ name: 'Rede' } as any)).resolves.toEqual({ id: 1 });
    await expect(masterService.updateNetwork(1, { name: 'Rede' } as any)).resolves.toEqual({
      id: 1,
    });
    await expect(masterService.getWorkloadPolicies(2)).resolves.toEqual({ id: 1 });
    await expect(masterService.createWorkloadPolicy({ name: 'P' } as any)).resolves.toEqual({
      id: 1,
    });
    await expect(masterService.updateWorkloadPolicy(1, { name: 'P' } as any)).resolves.toEqual({
      id: 1,
    });
    await expect(masterService.createSchool({ name: 'E' } as any)).resolves.toEqual({ id: 1 });
    await expect(masterService.updateSchool(1, { name: 'E' } as any)).resolves.toEqual({ id: 1 });
    await expect(masterService.updateUser(1, { name: 'U' })).resolves.toEqual({ id: 1 });
  });

  it('getClassesAvailable conta as aulas disponíveis (com e sem envelope)', async () => {
    (api.get as any)
      .mockResolvedValueOnce({ data: { data: [{ id: 1 }, { id: 2 }] } })
      .mockResolvedValueOnce({ data: [{ id: 3 }] });

    await expect(masterService.getClassesAvailable()).resolves.toBe(2);
    await expect(masterService.getClassesAvailable()).resolves.toBe(1);

    expect(api.get).toHaveBeenNthCalledWith(1, '/classes?available=true');
    expect(api.get).toHaveBeenNthCalledWith(2, '/classes?available=true');
  });

  it('getSubstitutionsThisMonth conta apenas as substituições do mês corrente', async () => {
    const agora = new Date().toISOString();
    (api.get as any).mockResolvedValue({
      data: [
        { id: 1, createdAt: agora },
        { id: 2, createdAt: '2000-01-01T00:00:00.000Z' },
      ],
    });

    await expect(masterService.getSubstitutionsThisMonth()).resolves.toBe(1);

    expect(api.get).toHaveBeenCalledWith('/enrollment-requests?status=APPROVED');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generateTempPassword sempre tem 12 caracteres sem símbolos', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateTempPassword()).toMatch(/^[A-Za-z0-9]{12}$/);
    }
  });

  it('generateTempPassword funciona sem crypto.getRandomValues', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', undefined);
    try {
      expect(generateTempPassword()).toHaveLength(12);
    } finally {
      vi.stubGlobal('crypto', original);
    }
  });

  it('updateUser manda só os campos de cadastro', async () => {
    (api.patch as any).mockResolvedValue({ data: { id: 3 } });

    await masterService.updateUser(3, { name: 'Novo' });

    expect(api.patch).toHaveBeenCalledWith('/users/3', { name: 'Novo' });
  });

  it('getCoordinators e removeCoordinator usam /network-coordinators', async () => {
    (api.get as any).mockResolvedValue({ data: [{ userId: 1 }] });
    (api.delete as any).mockResolvedValue({ data: {} });

    await expect(masterService.getCoordinators()).resolves.toEqual([{ userId: 1 }]);
    await masterService.removeCoordinator(1, 2);

    expect(api.get).toHaveBeenCalledWith('/network-coordinators');
    expect(api.delete).toHaveBeenCalledWith('/network-coordinators/1/2');
  });

  it('findUserByEmail devolve o básico ou null', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: [{ id: 4, name: 'Ana', email: 'ana@x.com', phone: '1' }],
    });
    await expect(masterService.findUserByEmail(' ana@x.com ')).resolves.toEqual({
      id: 4,
      name: 'Ana',
      email: 'ana@x.com',
    });
    expect(api.get).toHaveBeenCalledWith('/users', { params: { email: 'ana@x.com' } });

    (api.get as any).mockResolvedValueOnce({ data: [] });
    await expect(masterService.findUserByEmail('x@x.com')).resolves.toBeNull();
  });

  it('addCoordinator vincula quem já tem cadastro sem criar conta', async () => {
    (api.get as any).mockResolvedValue({
      data: [{ id: 4, name: 'Ana', email: 'ana@x.com' }],
    });
    (api.post as any).mockResolvedValue({ data: {} });

    const result = await masterService.addCoordinator({
      name: 'Ana',
      email: 'ana@x.com',
      phone: '1',
      networkId: 2,
    });

    expect(result).toEqual({ userId: 4, created: false, tempPassword: undefined });
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/network-coordinators', {
      userId: 4,
      networkId: 2,
    });
  });

  it('addCoordinator cria a conta com senha temporária quando o e-mail é novo', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    (api.post as any)
      .mockResolvedValueOnce({ data: { id: 9 } })
      .mockResolvedValueOnce({ data: {} });

    const result = await masterService.addCoordinator({
      name: 'Rui',
      email: 'rui@x.com',
      phone: '2',
      networkId: 3,
    });

    expect(result.userId).toBe(9);
    expect(result.created).toBe(true);
    expect(result.tempPassword).toHaveLength(12);
    expect(api.post).toHaveBeenNthCalledWith(1, '/users', {
      name: 'Rui',
      email: 'rui@x.com',
      phone: '2',
      password: result.tempPassword,
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/network-coordinators', {
      userId: 9,
      networkId: 3,
    });
    // A senha é gerada de novo no servidor (e enviada por e-mail se houver SMTP).
    expect(api.post).toHaveBeenNthCalledWith(3, '/users/9/reset-password');
    expect(result.emailSent).toBe(false);
  });
});

describe('masterService — disciplinas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lista em ordem alfabética', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: 2, name: 'Português' },
        { id: 1, name: 'Artes' },
      ],
    });
    expect(await masterService.getSubjects()).toEqual([
      { id: 1, name: 'Artes' },
      { id: 2, name: 'Português' },
    ]);
    expect(api.get).toHaveBeenCalledWith('/subjects');
  });

  it('cria, renomeia e remove', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 3, name: 'X' } });
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { id: 3, name: 'Y' } } });
    vi.mocked(api.delete).mockResolvedValue({ data: {} });

    expect(await masterService.createSubject(' X ')).toEqual({ id: 3, name: 'X' });
    expect(api.post).toHaveBeenCalledWith('/subjects', { name: 'X' });
    expect(await masterService.renameSubject(3, ' Y')).toEqual({ id: 3, name: 'Y' });
    expect(api.patch).toHaveBeenCalledWith('/subjects/3', { name: 'Y' });
    await masterService.deleteSubject(3);
    expect(api.delete).toHaveBeenCalledWith('/subjects/3');
  });
});

describe('masterService.issueTempPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usa a senha gerada no servidor e informa o e-mail', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { tempPassword: 'Srv123', emailSent: true },
    });
    expect(await masterService.issueTempPassword(9, 'Local1')).toEqual({
      tempPassword: 'Srv123',
      emailSent: true,
    });
    expect(api.post).toHaveBeenCalledWith('/users/9/reset-password');
  });

  it('se falhar, mantém a senha da criação e sem e-mail', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('500'));
    expect(await masterService.issueTempPassword(9, 'Local1')).toEqual({
      tempPassword: 'Local1',
      emailSent: false,
    });
  });
});
