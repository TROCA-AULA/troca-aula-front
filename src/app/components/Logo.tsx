'use client'
import styled, {css} from 'styled-components'

interface SetaProps {
    type?: string;
}

const Seta = styled.div<SetaProps>`
    width: 100%;
    height: 3px;
    background-color: ${({ theme }) => theme.colors.textMuted};
    position: absolute;
    bottom: 10px;
    &:after {
        content: '';
        display: block;
        width: 10px;
        height: 10px;
        border-top: 3px solid ${({ theme }) => theme.colors.textMuted};
        border-right: 3px solid ${({ theme }) => theme.colors.textMuted};
        transform: rotate(45deg);
        position: absolute;
        top: -5px;
        right: 0;
    }

    ${({type}) => type==='inverse' && css`
        background-color: ${({ theme }) => theme.colors.brand};
        bottom: auto;
        top: 10px;

        &:after {
            content: '';
            display: block;
            width: 10px;
            height: 10px;
            border-top: 3px solid ${({ theme }) => theme.colors.brand};
            border-right: 3px solid ${({ theme }) => theme.colors.brand};
            transform: rotate(225deg);
            position: absolute;
            top: -5px;
            left: 0;
        }
    `}
`
const LogoMarca = styled.div`
    display: flex;
    gap: 8px;
 /* Reduz para 80% do tamanho original */
    transform-origin: center center; /* Define o ponto de origem da transformação */
    position: relative;
    h1 {
        color: ${({ theme }) => theme.colors.brand};
        padding: 20px 0;
        position: relative;
        font-size: 30px;
        line-height: 30px;
        font-family: sans-serif;
        text-transform: uppercase;
        &:nth-child(2) {
            color: ${({ theme }) => theme.colors.textMuted};
        }
    }
`
interface LogoMarcaWrapperProps{
    percent?: number;
}
const LogoMarcaWrapper = styled.div<LogoMarcaWrapperProps>`
    transform: scale(1); 
    ${props => props?.percent && props?.percent > 0 && css`
        transform: scale(${props.percent});
    `}
   
`

export default function Logo({size = 100}) {
    return (<LogoMarcaWrapper percent={size / 100}>
        <LogoMarca>
            <h1>
                Troca
                <Seta/>
            </h1>
            <h1><Seta type={'inverse'}/>
                Aula</h1>
        </LogoMarca>
    </LogoMarcaWrapper>

    );
}
