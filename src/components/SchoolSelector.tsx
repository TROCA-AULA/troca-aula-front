'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { schoolsService } from '@/services/schools.service';

const Select = styled.select`
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    font-size: 14px;
`;

/**
 * Seletor de "escola ativa" — só renderiza algo quando o usuário tem vínculo
 * com mais de uma escola (ex.: coordenador municipal, que ganha um vínculo
 * por escola da rede). Para quem só tem uma escola, não mostrar nada é o
 * comportamento correto.
 */
export function SchoolSelector() {
    const { schoolLinks, activeSchoolId, setActiveSchoolId } = useSchoolContext();
    const links = schoolLinks ?? [];
    const hasChoice = links.length > 1;
    const [names, setNames] = useState<Record<number, string>>({});

    // Nome das escolas: GET /schools já vem filtrado pelo RLS (só as escolas
    // que o usuário enxerga). Sem resposta, cai para "Escola #id".
    useEffect(() => {
        if (!hasChoice) return;
        let cancelled = false;
        schoolsService
            .getSchools()
            .then((schools) => {
                if (cancelled) return;
                const map: Record<number, string> = {};
                for (const school of schools ?? []) map[school.id] = school.name;
                setNames(map);
            })
            .catch(() => {
                // conveniência — sem nomes, o id continua funcionando
            });
        return () => {
            cancelled = true;
        };
    }, [hasChoice]);

    if (!hasChoice) {
        return null;
    }

    return (
        <Select
            value={activeSchoolId ?? ''}
            onChange={(e) => setActiveSchoolId(Number(e.target.value))}
            aria-label="Escola ativa"
        >
            {links.map((link) => (
                <option key={link.schoolId} value={link.schoolId}>
                    {names[link.schoolId] ?? `Escola #${link.schoolId}`}
                </option>
            ))}
        </Select>
    );
}
