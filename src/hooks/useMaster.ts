import { useRouter } from 'next/navigation';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';

export const useMaster = () => {
  const router = useRouter();
  const { user, isLoading } = useSchoolContext();

  // Correção: MASTER é profileId=4 no backend real (não 1, que é DIRETOR).
  // O valor antigo (1) fazia diretores entrarem na área master e bloqueava
  // o master de verdade — bug de autorização, não só cosmético.
  const isMaster = user?.profileId === PROFILE.MASTER;

  const checkAccess = () => {
    if (isLoading) return true;
    if (!user) {
      router.push('/login');
      return false;
    }
    if (user.profileId !== PROFILE.MASTER) {
      router.push('/dashboard');
      return false;
    }
    return true;
  };

  return {
    user,
    isLoading,
    isMaster,
    checkAccess,
  };
};