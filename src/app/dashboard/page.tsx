'use client'
import styled from 'styled-components'
import {useForm} from "react-hook-form";
import {useCallback, useEffect, useMemo, useState} from "react";
import {format} from "date-fns";
import * as Yup from 'yup';
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "react-toastify";
import {useSchoolContext} from "@/contexts/SchoolContext";
import {PROFILE, isStaffProfile, isSchoolScopedStaffProfile} from "@/constants/profile";
import {EnrollmentsList} from "@/components/EnrollmentsList";
import {useSubjects} from "@/hooks/useSubjects";
import {classesService} from "@/services/classes.service";
import {schoolsService} from "@/services/schools.service";
import {enrollmentService} from "@/services/enrollment.service";
import type {Class} from "@/types/enrollment";

// P8 (problemas-conhecidos.md): tipos reais do formato denormalizado que
// GET /classes devolve (school/subject/createdBy/enrolledBy populados via
// `with` no ClassesRepository) - específico deste dashboard legado, por
// isso local em vez de em types/enrollment.ts (que reflete o formato flat
// usado pelas telas modernas /classes e /minhas-aulas).
interface DashboardSchool {
    id: number;
    name: string;
}
interface DashboardSubject {
    id: number;
    name: string;
}
// Formato denormalizado que GET /classes devolve para este dashboard legado
// (school/subject/createdBy/enrolledBy populados via `with` no
// ClassesRepository) — herda o contrato base de types/enrollment.ts.
type DashboardClass = Class;

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    width: 100%;
`
const SubjectWarning = styled.div`
    background: ${({ theme }) => theme.colors.warningBg};
    color: ${({ theme }) => theme.colors.warning};
    border: 1px solid ${({ theme }) => theme.colors.warningBorder};
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 14px;
`

const Container = styled.div`
    display: flex;
    flex: 1;
    width: 100%;
    flex-direction: column;
    max-width: 1600px;
`
const Content = styled.div`
    display: flex;
    flex: 1;
    gap: 16px;
    align-self: stretch;
    width: 100%;
    height: 100%;
    font-size: 14px;
    line-height: 22px;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;

    table {
        width: 100%;
        text-align: left;
        border-radius: 5px;
        overflow: hidden;

        thead {
            background-color: ${({ theme }) => theme.colors.tableHeader};
        }

        th {
            padding: 10px;
            color: ${({ theme }) => theme.colors.tableHeaderText};
            text-transform: uppercase;
        }

        tbody {
            tr:nth-child(even) {
                background-color: ${({ theme }) => theme.colors.surfaceAlt};
            }
        }

        td {
            padding: 10px;
        }

        td:last-child, th:last-child {
            text-align: right;
        }

        button {
            cursor: pointer;
            background-color: ${({ theme }) => theme.colors.primary};
            border: none;
            padding: 5px 10px;
            margin-right: 5px;
            border-radius: 3px;
            color: ${({ theme }) => theme.colors.surface};

            &:hover {
                background-color: ${({ theme }) => theme.colors.primaryHover};
            }

            &:last-child {
                margin-right: 0;
            }
        }
    }
`
const Card = styled.section`

    display: flex;
    max-width: 1600px;
    /* 64px do cabeçalho do AppShell + 2 x 20px de margem. */
    min-height: calc(100vh - 104px);
    flex-direction: column;
    margin: 20px;
    border-radius: 10px;
    overflow: hidden;

`
const CardContent = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    background-color: ${({ theme }) => theme.colors.surface};
    gap: 16px;
    border-top-right-radius: 10px;

    button {
        transition: all .3s;
    }

    header {
        display: flex;
        gap: 16px;


    }

    padding: 20px;
`
const Search = styled.div`
    display: flex;
    height: 40px;
    width: 100%;
    border-radius: ${({ theme }) => theme.radius.md};
    overflow: hidden;

    input {
        flex: 1;
        min-width: 0;
        border: 1px solid ${({ theme }) => theme.colors.borderStrong};
        border-right: none;
        border-radius: ${({ theme }) => theme.radius.md} 0 0 ${({ theme }) => theme.radius.md};
        background-color: ${({ theme }) => theme.colors.surface};
        color: ${({ theme }) => theme.colors.text};
        padding: 5px 12px;

        &:focus {
            outline: none;
            border-color: ${({ theme }) => theme.colors.primary};
        }
    }

    & > button {
        border: none;
        background-color: ${({ theme }) => theme.colors.primary};
        padding: 5px 30px;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.onPrimary};
        text-transform: uppercase;
        cursor: pointer;

        &:hover {
            background-color: ${({ theme }) => theme.colors.primaryHover};
        }
    }
`
const Form = styled.form`
    display: flex;
    flex-wrap: wrap;
    gap: 16px;

    /* Os campos dividem a largura e só quebram linha quando não cabem. */
    & > input, & > select, & > label {
        flex: 1 1 170px;
        min-width: 0;
    }

    label {
        display: flex;
        flex-direction: column;
    }

    label > input, label > select {
        width: 100%;
    }

    p {
        margin: 2px auto;
        color: ${({ theme }) => theme.colors.danger};
    }

    input, select {
        height: 40px;
        background-color: ${({ theme }) => theme.colors.surface};
        border: 1px solid ${({ theme }) => theme.colors.borderStrong};
        border-radius: ${({ theme }) => theme.radius.md};
        padding: 5px 12px;
        color: ${({ theme }) => theme.colors.text};

        &:focus {
            outline: none;
            border-color: ${({ theme }) => theme.colors.primary};
            box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.focusRing};
        }

        &:disabled {
            background-color: ${({ theme }) => theme.colors.surfaceAlt};
            color: ${({ theme }) => theme.colors.textMuted};
        }
    }

    & > button {
        cursor: pointer;
        padding: 5px 20px;
        border: none;
        border-radius: ${({ theme }) => theme.radius.md};
        background-color: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.onPrimary};
        font-weight: 600;
        text-transform: uppercase;

        &:hover {
            background-color: ${({ theme }) => theme.colors.primaryHover};
        }
    }
`
const TabHeader = styled.div`
    display: flex;
    background-color: ${({ theme }) => theme.colors.surfaceAlt};
    width: 100%;
    height: 60px;

    button {
        border: none;
        background-color: transparent;
        padding: 10px 20px;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        text-transform: uppercase;
        cursor: pointer;
        color: ${({ theme }) => theme.colors.textMuted};

        &:hover {
            background-color: ${({ theme }) => theme.colors.primarySoft};
            color: ${({ theme }) => theme.colors.primary};
        }

        &.active {
            background-color: ${({ theme }) => theme.colors.surface};
            color: ${({ theme }) => theme.colors.primary};
        }
    }

`
const Divider = styled.div`
    width: 100%;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.surfaceAlt};
`


const validationSchema = Yup.object({
    subject: Yup.number().min(1, 'Materia é obrigatório').required('Materia é obrigatório'),
    startAt: Yup.string().required('Inicio é obrigatório'),
    finishedAt: Yup.string().required('Termino é obrigatório'),
});

export default function Home() {
    const [classes, setClasses] = useState<DashboardClass[]>([])
    const [school, setSchool] = useState<DashboardSchool | undefined>()
    const [schools, setSchools] = useState<DashboardSchool[]>([])
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)
    const [preSearch, setPreSearch] = useState('')
    const [search, setSerch] = useState('')
    const [all, setAll] = useState<'classes' | 'myclasses' | 'enrollments'>('classes')

    const {register, handleSubmit, formState} = useForm({
        resolver: yupResolver(validationSchema),
    });

    const {user, refreshUserData} = useSchoolContext();
    const {subjects} = useSubjects();
    
    const loadClasses = useCallback(() => {
        // P9: chamada centralizada no service (via proxy), sem axios direto
        // na página. O backend injeta o userId do token (P16).
        classesService.getClasses().then((data) => {
            setClasses(data)
        })
    }, [])

    const submit = handleSubmit(async (data) => {
            const {finishedAt, startAt, subject} = data;
            // Correção: MASTER (profileId=4) vê o dropdown de todas as escolas;
            // demais perfis com escopo de escola (DIRETOR/AUXILIAR_ADMIN) usam a
            // própria escola. O valor antigo (1) era DIRETOR, não MASTER.
            const schoolId = user?.profileId === PROFILE.MASTER ? selectedSchoolId : user?.schoolId;
            const payload = {
                schoolId: schoolId,
                subjectId: Number(subject),
                createdByd: user?.id,
                statededAt: startAt,
                finishedAt: finishedAt
            }
            try {
                await classesService.createClass(payload);
                toast.success('Aula cadastrada com sucesso')
                loadClasses()
            } catch (error) {
                toast.error('Erro ao cadastrar aula')
            }
        }
    );

    const accept = (id: number)=>async () => {
        try {
            await enrollmentService.createEnrollment({ classId: id });
            toast.success('Candidatura enviada com sucesso')
            loadClasses()
        } catch (error) {
            toast.error('Erro ao enviar candidatura')
        }
    };

    const deleteData = (id: number) => async() => {
        try {
            await classesService.deleteClass(id);
            toast.success('Aula removida com sucesso')
            loadClasses()
        } catch (error) {
            toast.error('Erro ao remover aula')
        }
    };

    useEffect(() => {
        if (!user) refreshUserData();
    }, [user]);

    // Recarrega ao trocar de aba (D14): uma candidatura aprovada na aba
    // "Candidaturas" já aparece em "Aulas aceitas" sem precisar de F5.
    useEffect(() => {
        loadClasses();
    }, [loadClasses, all]);

    useEffect(() => {
        if (!user) return;
        
        if (user.profileId === PROFILE.MASTER) {
            schoolsService.getSchools().then((data) => {
                setSchools(data || [])
                if (data?.length > 0) {
                    setSelectedSchoolId(data[0].id)
                    setSchool(data[0])
                }
            }).catch(() => {})
        } else if (isSchoolScopedStaffProfile(user.profileId) && user.schoolId) {
            schoolsService.getSchool(user.schoolId).then((data) => {
                setSchool(data)
                setSelectedSchoolId(user.schoolId ?? null)
            }).catch(() => {})
        }
    }, [user]);


    const classesFiltered = useMemo(() => {
        if (all === 'classes') {
            return classes.filter(item => item?.enrolledById === null).filter((item) => `${item?.subject?.name} ${item?.school?.name}`.toLowerCase().includes(search.toLowerCase()));
        }
        if (user?.profileId === PROFILE.PROFESSOR) return classes.filter(item => item?.enrolledById === user?.id).filter((item) => `${item?.subject?.name} ${item?.school?.name}`.toLowerCase().includes(search.toLowerCase()));

        return classes.filter(item => item?.enrolledById != null).filter((item) => `${item?.subject?.name} ${item?.school?.name}`.toLowerCase().includes(search.toLowerCase()));
    }, [all, classes, search, user])
    return (<>
            {/* Menu, escola ativa, notificações e "Sair" ficam no AppShell
                (src/components/app-shell), comum a todas as telas logadas. */}
            <Wrapper>
                <Container>
                    {/* D9: professor sem disciplina não vê nenhuma vaga — avisa
                        em vez de mostrar uma lista vazia sem explicação. */}
                    {user?.profileId === PROFILE.PROFESSOR && user?.subjectId == null && (
                        <SubjectWarning role="alert">
                            Sua disciplina não está cadastrada, por isso nenhuma vaga aparece.
                            Peça para a direção da escola definir sua disciplina e depois
                            recarregue a página.
                        </SubjectWarning>
                    )}
                    <Card>

                        <TabHeader>
                            <button className={all === 'classes' ? 'active' : 'inactive'} onClick={() => setAll('classes')}>Aulas Disponiveis</button>
                            <button className={all === 'myclasses' ? 'active' : 'inactive'} onClick={() => setAll('myclasses')}>
                                {user?.profileId !== PROFILE.PROFESSOR ? 'Aulas aceitas' : 'Minhas Aulas'}
                            </button>
                            {isStaffProfile(user?.profileId) && (
                                <button className={all === 'enrollments' ? 'active' : 'inactive'} onClick={() => setAll('enrollments')}>
                                    Candidaturas
                                </button>
                            )}
                        </TabHeader>
                        <CardContent>
                            {
                                all && user?.profileId !== PROFILE.PROFESSOR && (

                                <>
                                    <Form onSubmit={submit}>
                                        {user?.profileId === PROFILE.MASTER ? (
                                            <select
                                                value={selectedSchoolId || ''}
                                                onChange={(e) => {
                                                    const id = parseInt(e.target.value);
                                                    setSelectedSchoolId(id);
                                                    const selected = schools.find(s => s.id === id);
                                                    if (selected) setSchool(selected);
                                                }}
                                            >
                                                <option value="">Selecione a Escola</option>
                                                {schools.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                value={school?.name ?? 'Nome da Escola'} disabled={true} type={'text'}
                                            />
                                        )}
                                        <label>
                                            <select
                                                {...register("subject")}
                                            >
                                                <option value={-1}>Materia</option>
                                                {subjects?.map((item, index) => (
                                                    <option key={`item-${item?.id}`}
                                                            value={item.id}>{item?.name}</option>
                                                ))}
                                            </select>
                                            {formState.errors?.subject && (<p>{formState.errors.subject.message}</p>)}
                                        </label>
                                        <label>
                                            <input
                                                {...register("startAt")}
                                                placeholder={'Inicio'} type={'datetime-local'}/>
                                            {formState.errors?.startAt && (<p>{formState.errors.startAt.message}</p>)}
                                        </label>
                                        <label>
                                            <input
                                                {...register("finishedAt")}
                                                placeholder={'Termino'} type={'datetime-local'}/>
                                            {formState.errors?.finishedAt && (
                                                <p>{formState.errors.finishedAt.message}</p>)}
                                        </label>


                                        <button>Cadastrar</button>
                                    </Form>
                                    <Divider/>
                                </>
                            )}

                            {all === 'enrollments' && (
                                <EnrollmentsList schoolId={school?.id} />
                            )}

                            {all !== 'enrollments' && (
                            <>
                            <header>
                                <Search>
                                    <input placeholder={'Pesquisar'} value={preSearch} type={'text'}
                                           onChange={(e) => setPreSearch(e.target.value)}/>
                                    <button type={'button'} onClick={() => setSerch(preSearch)}>Buscar</button>
                                </Search>
                            </header>

                            <Content>
                                <table cellPadding={0} cellSpacing={0}>
                                    <thead>
                                    <tr>
                                        <th>Materia</th>
                                        <th>Escola</th>
                                        <th>Inicio</th>
                                        <th>Termino</th>
                                        {user?.profileId !== PROFILE.PROFESSOR && (<th>Professor</th>)}
                                        <th>Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {classesFiltered.map((item) => (
                                        <tr key={`item-${item?.id}`}>
                                            <td>{item?.subject?.name}</td>
                                            <td>{item?.school?.name}</td>
                                            <td>{item?.statededAt ? format(new Date(item.statededAt), 'dd/MM/yyyy HH:mm:ss') : '-'}</td>
                                            <td>{item?.finishedAt ? format(new Date(item.finishedAt), 'dd/MM/yyyy HH:mm:ss') : '-'}</td>
                                            {user?.profileId !== PROFILE.PROFESSOR && (<td>{item?.enrolledBy?.name}</td>)}
                                            <td>
                                                {user?.profileId === PROFILE.PROFESSOR ?
                                                    (!item?.enrolledBy && (<button onClick={accept(item?.id)}>aceitar</button>)) :
                                                    (
                                                        <>
                                                            {
                                                                !item?.enrolledBy ? (
                                                                    <button onClick={deleteData(item?.id)}>deletar</button>
                                                                ) : null
                                                            }


                                                        </>
                                                    )}
                                            </td>
                                        </tr>
                                    ))}

                                    </tbody>
                                </table>
                            </Content>
                            </>
                            )}
                        </CardContent>

                    </Card>
                </Container>


            </Wrapper>
        </>

    );
}
