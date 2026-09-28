// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from '@/api-client.service';

export const accountService = {
  // PATCH /auth/change-password (AuthGuard) — troca a senha do próprio
  // usuário autenticado.
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const response = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data?.data ?? response.data;
  },

  // POST /users/:id/reset-password (gestor) — gera senha temporária no
  // servidor e devolve uma única vez para repassar ao usuário.
  resetUserPassword: async (userId: number): Promise<{ tempPassword: string }> => {
    const response = await api.post(`/users/${userId}/reset-password`);
    return response.data?.data ?? response.data;
  },
};
