'use client'
import styled from 'styled-components'
import Logo from "@/app/components/Logo";
import {useForm} from "react-hook-form";
import * as Yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup"
import {useRouter} from 'next/navigation'
import {toast} from "react-toastify";
// P9 (problemas-conhecidos.md): api.service.tsx é uso exclusivamente
// server-side (Route Handlers) - este é um componente client. O cadastro
// público não precisa de Authorization (rota sem guarda), então "funcionava"
// mesmo assim, mas violava a arquitetura documentada; api-client.service é
// o cliente certo para chamadas do navegador.
import api from "@/api-client.service";
import {useSubjects} from "@/hooks/useSubjects";

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;

`
const Content = styled.div`
    display: flex;
    flex: 1;
    gap: 16px;
    font-size: 14px;
    line-height: 22px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;

    label {
        width: 100%;
    }

    p {
        color: ${({ theme }) => theme.colors.danger};
        text-transform: uppercase;
    }

    dt {
        margin-top: 20px;
        margin-bottom: 10px;
        color: ${({ theme }) => theme.colors.primary};
        font-weight: bold;
        text-transform: uppercase;
    }

    dd {
        text-align: justify;
        color: ${({ theme }) => theme.colors.textMuted};
    }

    input, select {
        height: 40px;
        width: 100%;
        padding: 5px 10px;
        border-radius: 5px;

        /* Um tom abaixo do painel verde, para o campo aparecer. */
        background-color: ${({ theme }) => theme.colors.primaryHover};
        border: 2px solid ${({ theme }) => theme.colors.primaryHover};
        color: ${({ theme }) => theme.colors.onPrimary};
        box-sizing: border-box;

        &:focus {
            outline: none;
            border: 2px solid ${({ theme }) => theme.colors.sidebarSection};
        }

        &::placeholder {
            color: ${({ theme }) => theme.colors.sidebarText};
            text-transform: uppercase;
            opacity: 1; /* Garante visibilidade total, especialmente no Firefox */
        }
    }

    button {
        display: block;
        width: 100%;
        height: 40px;
        border-radius: 5px;
        border: none;
        color: ${({ theme }) => theme.colors.primary};
        text-transform: uppercase;
        cursor: pointer;
        background-color: ${({ theme }) => theme.colors.surface};
        transition: background-color 0.2s;

        &:hover {
            background-color: ${({ theme }) => theme.colors.primarySoft};
        }

        &.clear {
            background: transparent;
            height: auto;
            color: ${({ theme }) => theme.colors.surface};

            &:hover {
                text-decoration: underline;
            }
        }
    }
`
// Dica sobre o painel verde (cor do tema, sem estilo inline).
const Hint = styled.small`
    color: ${({ theme }) => theme.colors.sidebarText};
`

const Card = styled.div`
    display: flex;
    background-color: ${({ theme }) => theme.colors.surface};
    max-width: 1024px;
    flex-direction: row;
    margin: 20px;
    border-radius: 10px;
    overflow: hidden;

    ${Content} {
        &:nth-child(2) {
            background-color: ${({ theme }) => theme.colors.primary};
            max-width: 400px;
        }
    }
`

const validationSchema = Yup.object({
    name: Yup.string().required('Nome é obrigatório'),
    email: Yup.string().required('E-mail é obrigatório'),
    phone: Yup.string().required('Telefone é obrigatório'),
    // Defeito D10: o backend exige pelo menos 8 caracteres.
    password: Yup.string()
        .required('Senha é obrigatório')
        .min(8, 'A senha precisa ter pelo menos 8 caracteres'),
    // Defeito D9: sem disciplina o professor não vê nenhuma vaga (a lista
    // de aulas filtra pela disciplina dele). Opcional porque diretor e
    // auxiliar também se cadastram por aqui.
    subjectId: Yup.string().optional(),
    confirmpPass: Yup.string()
        // Tipagem do Yup para .oneOf() não aceita bem misturar Ref com
        // null no array (o "null" aqui é proposital: permite deixar o
        // campo em branco sem disparar o erro de "senhas não conferem",
        // já que este campo não tem .required() próprio).
        .oneOf([Yup.ref('password'), null] as unknown as (string | undefined)[], 'As senhas não conferem')
});

export default function Home() {
    const {register, handleSubmit, formState} = useForm({
        resolver: yupResolver(validationSchema)
    });
    const router = useRouter();
    const {subjects} = useSubjects();

    const submidt = handleSubmit(async (data) => {

        // Correção: o backend (CreateUserDto) não aceita profileId/schoolId na
        // criação pública de usuário (ValidationPipe com forbidNonWhitelisted
        // rejeita propriedades extras com 400) — o vínculo escola/perfil é
        // feito depois, por quem tem permissão, via POST /users/:id/assign-profile.
        // P3 (problemas-conhecidos.md): senha em texto puro sobre TLS, sem
        // pré-hash no cliente — ver AuthService.signIn no backend.
        const payload = {
            password: data.password,
            name: data.name,
            email: data.email,
            phone: data.phone,
            ...(data.subjectId ? {subjectId: Number(data.subjectId)} : {}),
        }
        try {
            await api.post('/users', payload);
        } catch (e) {
            // A mensagem do backend (ex.: "E-mail já cadastrado") já aparece
            // no toast do api-client.
            console.error(e);
            return;
        }
        toast.success('Usuário cadastrado com sucesso')
        // redirect() do next/navigation não funciona dentro de um clique
        // (ele lança uma exceção que o try/catch engolia) — usa o router.
        router.push('/')


    })

    return (
        <Wrapper>
            <Card>
                <Content>
                    <Logo size={70}/>
                    <dl>
                        <dt>🌟 Bem-vindo ao Troca Aula!</dt>
                        <dd>Em um mundo onde a educação é a chave para o progresso, cada aula conta. Pensando nisso,
                            criamos uma plataforma que conecta professores disponíveis a escolas que precisam de
                            substituições, garantindo que o aprendizado dos alunos não seja interrompido.
                        </dd>
                        <dt>📚 Nossa Missão</dt>
                        <dd>Facilitar o encontro entre educadores comprometidos e instituições de ensino, promovendo uma
                            rede de apoio mútuo que valoriza o tempo e o conhecimento de cada profissional.
                        </dd>
                        <dt>🤝 Como Funciona</dt>
                        <dd>Para Professores: Cadastre-se e encontre oportunidades de substituição que se encaixem na
                            sua agenda e especialidade.<br/>
                            Para Escolas: Publique suas necessidades de substituição e encontre rapidamente
                            profissionais qualificados e disponíveis.
                        </dd>
                        <dt>🚀 Juntos pela Educação</dt>
                        <dd>Acreditamos que, ao unir tecnologia e propósito, podemos transformar desafios em
                            oportunidades. Seja parte dessa mudança e contribua para uma educação mais contínua e
                            eficaz.
                        </dd>
                    </dl>
                </Content>
                <Content>
                    <label>
                        <input {...register("name")} placeholder={'nome'} type={'text'}/>
                        {formState.errors?.name && (<p>{formState.errors.name.message}</p>)}
                    </label>
                    <label>
                        <input {...register("email")} placeholder={'e-mail'} type={'email'}/>
                        {formState.errors?.email && (<p>{formState.errors.email.message}</p>)}
                    </label>
                    <label>
                        <input {...register("phone")} placeholder={'telefone'} type={'phone'}/>
                        {formState.errors?.phone && (<p>{formState.errors.phone.message}</p>)}
                    </label>
                    <label>
                        <select {...register("subjectId")} aria-label={'disciplina'} defaultValue={''}>
                            <option value={''}>Disciplina (professor)</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                        </select>
                        <Hint>
                            Professor: escolha a disciplina que você leciona — só aparecem
                            vagas dela.
                        </Hint>
                    </label>
                    <label>
                        <input {...register("password")} placeholder={'senha (mínimo 8 caracteres)'} type={'password'}/>
                        {formState.errors?.password && (<p>{formState.errors.password.message}</p>)}
                    </label>
                    <label>
                        <input {...register("confirmpPass")} placeholder={'confirme a senha'} type={'password'}/>
                        {formState.errors?.confirmpPass && (<p>{formState.errors.confirmpPass.message}</p>)}
                    </label>
                    <button type={'button'} onClick={submidt}>Cadastrar</button>
                </Content>
            </Card>

        </Wrapper>
    );
}
