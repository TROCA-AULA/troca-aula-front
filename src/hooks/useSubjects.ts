import { useEffect, useState } from 'react';
import { indicatorsService } from '@/services/indicators.service';
import type { Subject } from '@/types/teacher';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    let cancelled = false;
    indicatorsService
      .getSubjects()
      .then((data) => {
        if (!cancelled) setSubjects(data);
      })
      .catch(() => {
        // Filtro é conveniência — sem a lista, o recorte geral continua útil.
        if (!cancelled) setSubjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { subjects };
}
