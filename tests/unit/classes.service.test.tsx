import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classesService } from '@/services/classes.service';
import api from '@/api-client.service';

vi.mock('@/api-client.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('classesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getClasses devolve a lista do backend', async () => {
    const classes = [{ id: 1, subjectId: 2, statededAt: null, available: true }];
    (api.get as any).mockResolvedValue({ data: classes });

    const result = await classesService.getClasses();

    expect(api.get).toHaveBeenCalledWith('/classes');
    expect(result).toEqual(classes);
  });

  it('createClass envia o payload e devolve a aula criada', async () => {
    const created = { id: 9, subjectId: 2, statededAt: '2026-10-01', available: true };
    (api.post as any).mockResolvedValue({ data: created });

    const payload = {
      schoolId: 1,
      subjectId: 2,
      createdByd: 7,
      statededAt: '2026-10-01',
      finishedAt: '2026-10-01T10:00:00Z',
    };
    const result = await classesService.createClass(payload);

    expect(api.post).toHaveBeenCalledWith('/classes', payload);
    expect(result).toEqual(created);
  });

  it('deleteClass chama DELETE /classes/:id', async () => {
    (api.delete as any).mockResolvedValue({});

    await classesService.deleteClass(5);

    expect(api.delete).toHaveBeenCalledWith('/classes/5');
  });
});
