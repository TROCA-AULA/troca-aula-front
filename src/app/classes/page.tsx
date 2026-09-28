'use client';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE } from '@/constants/profile';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useEnrollmentMutations } from '@/hooks/useEnrollment';
import { useSubstitutionLimit } from '@/hooks/useSubstitutionLimit';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh - 60px);
  padding: 20px;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 24px;
  margin-bottom: 20px;
`;

const ClassesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const ClassCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid #f4f4f4;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ClassInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ClassLabel = styled.span`
  font-size: 12px;
  color: #989a9a;
  text-transform: uppercase;
`;

const ClassValue = styled.span`
  font-size: 16px;
  color: #333;
`;

const ApplyButton = styled.button`
  background-color: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.surface};
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  text-transform: uppercase;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Loading = styled.div`
  color: ${({ theme }) => theme.colors.accent};
  text-align: center;
  padding: 40px;
`;

const ErrorMessage = styled.div`
  color: #f00;
  text-align: center;
  padding: 20px;
`;

export default function ClassesPage() {
  const { user, isLoading: userLoading } = useSchoolContext();
  const router = useRouter();
  const { classes, loading, error, refetch } = useEnrollments();
  const { createEnrollment, loading: creating } = useEnrollmentMutations();
  
  const { canApply, loading: limitLoading, current, limit } = useSubstitutionLimit(
    user?.id,
  );

  if (userLoading) {
    return <Loading>Carregando...</Loading>;
  }

  if (!user) {
    // P5 (problemas-conhecidos.md): '/login' nunca existiu como rota — o
    // login vive em '/' (ver src/app/page.tsx).
    router.push('/');
    return null;
  }

  // Correção: MASTER é profileId=4 (o valor antigo, 1, é DIRETOR — bug real
  // de autorização, ver src/constants/profile.ts).
  if (user.profileId === PROFILE.MASTER) {
    router.push('/master');
    return null;
  }

  const handleApply = async (classId: number) => {
    if (!canApply) {
      toast.error(`Não é possível se candidatar. Limite de ${limit} substituições atingido para este semestre.`);
      return;
    }
    try {
      await createEnrollment({ classId });
      toast.success('Candidatura enviada com sucesso!');
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar candidatura';
      toast.error(message);
    }
  };

  if (loading) {
    return <Loading>Carregando aulas disponíveis...</Loading>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <Wrapper>
      <Title>Aulas Disponíveis</Title>
      {classes.length === 0 ? (
        <p>Nenhuma aula disponível no momento.</p>
      ) : (
        <ClassesGrid>
          {classes.map((classItem) => (
            <ClassCard key={classItem.id}>
              <ClassInfo>
                <ClassLabel>Disciplina</ClassLabel>
                <ClassValue>{classItem.subjectName || `Aula #${classItem.id}`}</ClassValue>
              </ClassInfo>
              <ClassInfo>
                <ClassLabel>Data</ClassLabel>
                <ClassValue>
                  {classItem.statededAt
                    ? format(new Date(classItem.statededAt), 'dd/MM/yyyy HH:mm')
                    : '-'}
                </ClassValue>
              </ClassInfo>
              <ApplyButton
                onClick={() => handleApply(classItem.id)}
                disabled={creating || !classItem.available || !canApply}
                title={!canApply ? `Limite de ${limit} substituições atingido` : undefined}
              >
                {classItem.available ? (!canApply ? 'Limite atingido' : 'Candidatar-se') : 'Indisponível'}
              </ApplyButton>
            </ClassCard>
          ))}
        </ClassesGrid>
      )}
    </Wrapper>
  );
}
