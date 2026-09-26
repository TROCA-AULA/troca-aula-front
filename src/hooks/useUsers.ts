import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterService } from '@/services/master.service';
import { PROFILE } from '@/constants/profile';
import type { User, CreateUserRequest } from '@/types/master';

// Correção: o tipo antigo era `2 | 3` seguindo um mapeamento próprio deste
// módulo (2=Diretor, 3=Administrador) que não batia com o valor real do
// backend (DIRETOR=1, AUXILIAR_ADMIN=2). Ver src/constants/profile.ts.
export function useUsers(
  profileId: typeof PROFILE.DIRETOR | typeof PROFILE.AUXILIAR_ADMIN,
  schoolId?: number,
) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await masterService.getUsers(profileId, schoolId);
      setUsers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [profileId, schoolId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (data: CreateUserRequest) => {
    try {
      const newUser = await masterService.createUser(data);
      setUsers((prev) => [...prev, newUser]);
      const role = profileId === PROFILE.DIRETOR ? 'Diretor' : 'Administrador';
      // Não há fluxo de convite/definição de senha por e-mail no backend —
      // a senha temporária precisa ser repassada manualmente. Toast mais
      // longo (sem timeout automático) para dar tempo de copiar.
      toast.success(
        `${role} "${newUser.name}" criado. Senha temporária: ${newUser.tempPassword} (repasse manualmente, essa senha não fica salva em nenhum outro lugar).`,
        { autoClose: false },
      );
      return newUser;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário';
      toast.error(message);
      throw err;
    }
  };

  const unlinkUser = async (userId: number, unlinkProfileId: number, unlinkSchoolId: number) => {
    try {
      await masterService.unlinkUser(userId, unlinkProfileId, unlinkSchoolId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('Vínculo removido com sucesso');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao desvincular usuário';
      toast.error(message);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    createUser,
    unlinkUser,
    refetch: fetchUsers,
  };
}