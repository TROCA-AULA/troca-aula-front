'use client';

import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';

const Select = styled.select`
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 14px;
`;

/**
 * Seletor de "escola ativa" — só renderiza algo quando o usuário tem vínculo
 * aprovado com mais de uma escola. Para quem só tem uma escola (a grande
 * maioria hoje), não mostrar nada é o comportamento correto, não uma lacuna.
 */
export function SchoolSelector() {
    const { schoolLinks, activeSchoolId, setActiveSchoolId } = useSchoolContext();

    if ((schoolLinks ?? []).length <= 1) {
        return null;
    }

    return (
        <Select
            value={activeSchoolId ?? ''}
            onChange={(e) => setActiveSchoolId(Number(e.target.value))}
            aria-label="Escola ativa"
        >
            {schoolLinks.map((link) => (
                <option key={link.schoolId} value={link.schoolId}>
                    Escola #{link.schoolId}
                </option>
            ))}
        </Select>
    );
}
