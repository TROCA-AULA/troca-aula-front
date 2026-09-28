'use client'
import styled from 'styled-components'
import Logo from "@/app/components/Logo";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "react-toastify";
import * as Yup from "yup";
import {useRouter} from "next/navigation";

// Importando o nosso botão recém-criado!
import { BotaoGovBr } from "../components/BotaoGovBr";

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
    label{
        width: 100%;
    }
    p {
        color: #993535;
        text-transform: uppercase;
    }

    dt {
        margin-top: 20px;
        margin-bottom: 10px;
        color: #509BA1;
        font-weight: bold;
        text-transform: uppercase;
    }

    dd {
        text-align: justify;
        color: #959595;
    }

    input {
        height: 40px;
        width: 100%;
        padding: 5px 10px;
        border-radius: 5px;

        background-color: #336367;
        border: 2px solid #336367;
        color: #fff;
        box-sizing: border-box;

        &:focus {
            outline: none;
            border: 2px solid #6bcdd5;
        }

        &::placeholder {
            color: #6bcdd5;
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
        color: #336367;
        text-transform: uppercase;
        cursor: pointer;
        background-color: #fff;
        transition: background-color 0.2s;

        &:hover {
            background-color: #daf3f3;
        }

    }

    a {
        background: transparent;
        height: auto;
        color: #ffffff;
        text-transform: uppercase;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
`
const Card = styled.div`
    display: flex;
    background-color: #fff;
    max-width: 1024px;
    flex-direction: row;
    margin: 20px;
    border-radius: 10px;
    overflow: hidden;

    ${Content} {
        &:nth-child(2) {
            background-color: #509BA1;
            max-width: 400px;
        }
    }
`

const validationSchema = Yup.object({
    email: Yup.string().required('E-mail é obrigatório'),
    password: Yup.string().required('Senha é obrigatório'),
});
export default function Home() {
    const router = useRouter()
    const {register, handleSubmit, formState} = useForm({
        resolver: yupResolver(validationSchema)
    });


        const submidt = handleSubmit(async (data) => {
            // P3 (problemas-conhecidos.md): senha vai em texto puro sobre
            // TLS, sem pré-hash no cliente — bcrypt no servidor (com salt)
            // já é a defesa real; o hash client-side não adicionava
            // segurança e causava um bug real (contas criadas pelo painel
            // Master nunca conseguiam logar). Ver AuthService.signIn.
            const payload = {
                password: data.password,
                email: data.email,
            }

            try {
                // const response = await api.post('/auth/login', payload);
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include',
                })
                if (response.ok) {
                    router.push('/dashboard');
                    toast.success('Login realizado com sucesso');
                } else {
                    toast.error( 'Erro ao fazer login');
                }
            } catch (error) {
                toast.error('Erro ao fazer login');
            }
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
                        <input {...register("email")} placeholder={'e-mail'} type={'email'}/>
                        {formState.errors?.email && (<p>{formState.errors.email.message}</p>)}
                    </label>
                    <label>
                        <input {...register("password")} placeholder={'senha'} type={'password'}/>
                        {formState.errors?.password && (<p>{formState.errors.password.message}</p>)}
                    </label>
                    <button type={"button"} onClick={submidt}>Entrar</button>
                    <a href={'./cadastro'}>Cadastrar</a>
                    
                    {/* Renderizando o componente do Botão Gov.br aqui */}
                    <BotaoGovBr />
                    
                </Content>
            </Card>

        </Wrapper>
    );
}