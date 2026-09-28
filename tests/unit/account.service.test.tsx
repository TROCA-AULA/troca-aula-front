import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountService } from '@/services/account.service';
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

describe('accountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('changePassword envia a senha atual e a nova', async () => {
    (api.patch as any).mockResolvedValue({ data: { data: { message: 'Senha alterada' } } });

    await expect(accountService.changePassword('atual123', 'nova123')).resolves.toEqual({
      message: 'Senha alterada',
    });

    expect(api.patch).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'atual123',
      newPassword: 'nova123',
    });
  });

  it('resetUserPassword usa o endpoint de reset do usuário', async () => {
    (api.post as any).mockResolvedValue({ data: { data: { tempPassword: 'Temp#123' } } });

    await expect(accountService.resetUserPassword(7)).resolves.toEqual({
      tempPassword: 'Temp#123',
    });

    expect(api.post).toHaveBeenCalledWith('/users/7/reset-password');
  });

  it('lida com respostas sem envelope', async () => {
    (api.patch as any).mockResolvedValue({ data: { message: 'ok' } });
    (api.post as any).mockResolvedValue({ data: { tempPassword: 'abc' } });

    await expect(accountService.changePassword('a', 'b')).resolves.toEqual({ message: 'ok' });
    await expect(accountService.resetUserPassword(7)).resolves.toEqual({ tempPassword: 'abc' });
  });
});
