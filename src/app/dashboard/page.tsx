'use client'
import styled from 'styled-components'
import Logo from "@/app/components/Logo";
import {useForm} from "react-hook-form";
import {useCallback, useEffect, useMemo, useState} from "react";
import {format} from "date-fns";
import * as Yup from 'yup';
// Client-side: usa o proxy Next.js, não o backend direto (o cookie de
// sessão é httpOnly, o JS do navegador não consegue anexá-lo sozinho —
// ver src/api-client.service.tsx).
import api from "@/api-client.service";
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "react-toastify";
import {useSchoolContext} from "@/contexts/SchoolContext";
import {PROFILE, isStaffProfile, isSchoolScopedStaffProfile} from "@/constants/profile";
import Link from "next/link";
import {EnrollmentsList} from "@/components/EnrollmentsList";
import {SubstitutionCounter} from "@/components/SubstitutionCounter";
import {SchoolSelector} from "@/components/SchoolSelector";
import {useSubstitutionLimit} from "@/hooks/useSubstitutionLimit";
import axios from "axios";

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    width: 100vw;
    height: calc(100vh - 60px);

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
            background-color: #6EC3C9;
        }

        th {
            padding: 10px;
            color: #fff;
            text-transform: uppercase;
        }

        tbody {
            tr:nth-child(even) {
                background-color: #f4f4f4;
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
            background-color: #509BA1;
            border: none;
            padding: 5px 10px;
            margin-right: 5px;
            border-radius: 3px;
            color: #fff;

            &:hover {
                background-color: #6EC3C9;
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
    min-height: calc(100vh - 100px);
    flex-direction: column;
    margin: 20px;
    border-radius: 10px;
    overflow: hidden;

`
const CardContent = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    background-color: #fff;
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
const Header = styled.header`
    display: flex;
    background-color: #fff;
    width: 100vw;
    height: 60px;
    align-items: center;
    justify-content: space-between;

    .profile {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        padding-right: 20px;

        button {
            background-color: transparent;
            border: none;
            cursor: pointer;
            color: #f00;
        }
    }


`
const Search = styled.div`
    display: flex;
    height: 40px;
    width: 100%;
    border-radius: 5px;
    overflow: hidden;

    input {
        flex: 1;
        border: none;
        background-color: #f4f4f4;
        padding: 5px 20px;
        outline: none;
    }

    & > button {
        border: none;
        background-color: #509BA1;
        padding: 5px 30px;
        color: #ffffff;
        text-transform: uppercase;
        cursor: pointer;

        &:hover {
            background-color: #6EC3C9;
        }
    }
`
const Form = styled.form`
    display: flex;
    gap: 16px;

    p {
        margin: 2px auto;
        color: #f00;
    }

    input, select {
        height: 40px;
        background-color: #f4f4f4;
        border: none;
        outline: none;
        border-radius: 5px;
        padding: 5px 20px;
    }

    select {
        position: relative;
        display: grid;
        border-right: 10px solid #f4f4f4;
    }

    & > button {
        cursor: pointer;
        padding: 5px 20px;
        border: none;
        border-radius: 5px;
        background-color: #f4f4f4;
        color: #509BA1;
        text-transform: uppercase;

        &:hover {
            background-color: #cdebed;
        }
    }
`
const TabHeader = styled.div`
    display: flex;
    background-color: #f4f4f4;
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
        color: #989a9a;

        &:hover {
            background-color: #dff4f4;
            color: #509BA1;
        }

        &.active {
            background-color: #fff;
            color: #509BA1;
        }
    }

`
const Divider = styled.div`
    width: 100%;
    height: 1px;
    background-color: #f4f4f4;
`


const validationSchema = Yup.object({
    subject: Yup.number().min(1, 'Materia é obrigatório').required('Materia é obrigatório'),
    startAt: Yup.string().required('Inicio é obrigatório'),
    finishedAt: Yup.string().required('Termino é obrigatório'),
});

export default function Home() {
    const [classes, setClasses] = useState([])
    const [school, setSchool] = useState<any>()
    const [schools, setSchools] = useState<any[]>([])
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)
    const [subjects, setSubjects] = useState<any[]>([])
    const [preSearch, setPreSearch] = useState('')
    const [search, setSerch] = useState('')
    const [all, setAll] = useState<'classes' | 'myclasses' | 'enrollments'>('classes')

    const {register, handleSubmit, formState} = useForm({
        resolver: yupResolver(validationSchema),
    });

    const {user, logout, refreshUserData} = useSchoolContext();
    
    const { current, limit, percentage, canApply, loading: limitLoading } = useSubstitutionLimit(
        user?.profileId === PROFILE.PROFESSOR ? user?.id : undefined,
    );

    const loadClasses = useCallback(() => {
        axios.get(`/api/classes`, {
            withCredentials: true,
            params: {
                userId: user?.id,
            }
        }).then((data) => {
            setClasses(data.data)
        })
    }, [user])

    const submit = handleSubmit(async (data) => {
            console.log(data)
            const {finishedAt, startAt, subject} = data;
            // Correção: MASTER (profileId=4) vê o dropdown de todas as escolas;
            // demais perfis com escopo de escola (DIRETOR/AUXILIAR_ADMIN) usam a
            // própria escola. O valor antigo (1) era DIRETOR, não MASTER.
            const schoolId = user?.profileId === PROFILE.MASTER ? selectedSchoolId : user?.schoolId;
            const payload = {
                // @ts-ignore
                schoolId: schoolId,
                subjectId: subject,
                createdByd: user?.id,
                statededAt: startAt,
                finishedAt: finishedAt
            }
            try {
                await api.post('/classes', payload);
                toast.success('Aula cadastrada com sucesso')
                loadClasses()
            } catch (error) {
                toast.error('Erro ao cadastrar aula')
            }
        }
    );

    const accept = (id: any)=>async () => {
        try {
            await api.post(`/enrollment-requests/request/${id}`);
            toast.success('Candidatura enviada com sucesso')
            loadClasses()
        } catch (error) {
            toast.error('Erro ao enviar candidatura')
        }
    };

    const deleteData = (id: any) => async() => {
        try {
            await axios.delete(`/api/classes/${id}`);
            toast.success('Aula removida com sucesso')
            loadClasses()
        } catch (error) {
            toast.error('Erro ao remover aula')
        }
    };

    useEffect(() => {
        if (!user) refreshUserData();
    }, [user]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);
    useEffect(() => {
        api.get('/subjects').then((data) => {
            setSubjects(data?.data || [])
        }).catch(() => {})
    }, []);

    useEffect(() => {
        if (!user) return;
        
        if (user.profileId === PROFILE.MASTER) {
            api.get('/schools').then((data) => {
                setSchools(data?.data || [])
                if (data?.data?.length > 0) {
                    setSelectedSchoolId(data.data[0].id)
                    setSchool(data.data[0])
                }
            }).catch(() => {})
        } else if (isSchoolScopedStaffProfile(user.profileId) && user.schoolId) {
            api.get(`/schools/${user.schoolId}`).then((data) => {
                setSchool(data?.data)
                setSelectedSchoolId(user.schoolId ?? null)
            }).catch(() => {})
        }
    }, [user]);


    const classesFiltered = useMemo(() => {
        if (all === 'classes') {
            // @ts-ignore
            return classes.filter(item => item?.enrolledById === null).filter((item) => `${item?.subject?.name} ${item?.school?.name}`.toLowerCase().includes(search.toLowerCase()));
        }
        // @ts-ignore
        if (user?.profileId === PROFILE.PROFESSOR) return classes.filter(item => item?.enrolledById === user?.id).filter((item) => `${item?.subject?.name} ${item?.school?.name}`.toLowerCase().includes(search.toLowerCase()));

        // @ts-ignore
        return classes.filter(item => item?.enrolledById != null).filter((item) => `${item?.subject?.name} ${item?.school?.name}`.toLowerCase().includes(search.toLowerCase()));
    }, [all, classes, search, user])
    return (<>
            <Header>
                <Logo size={60}/>
                <div className={'profile'}>
                    <SchoolSelector />
                    {(isSchoolScopedStaffProfile(user?.profileId) || user?.profileId === PROFILE.MASTER) && (
                        <>
                            <Link href="/escola/jornada-docente">Jornada Docente</Link>
                            <Link href="/escola/fechamento-ponto">Fechamento de Ponto</Link>
                        </>
                    )}
                    {user?.profileId === PROFILE.PROFESSOR && user?.schoolId && (
                        <SubstitutionCounter 
                            current={current} 
                            limit={limit} 
                            percentage={percentage}
                            loading={limitLoading}
                        />
                    )}
                    <p>
                        Olá, {user?.name}
                    </p>
                    <button onClick={logout}>Sair</button>
                </div>
            </Header>
            <Wrapper>
                <Container>
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
                            {        // @ts-ignore
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
                                    {classesFiltered.map((item: any, index) => (
                                        <tr key={`item-${item?.id}`}>
                                            <td>{item?.subject?.name}</td>
                                            <td>{item?.school?.name}</td>
                                            <td>{format(new Date(item?.statededAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                                            <td>{format(new Date(item?.finishedAt), 'dd/MM/yyyy HH:mm:ss')}</td>
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
