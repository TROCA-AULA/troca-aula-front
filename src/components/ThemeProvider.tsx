'use client';

import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';

// O ThemeProvider do styled-components detecta ambiente de React Server
// Components (`React.createContext` indefinido) e vira um pass-through — se
// fosse usado direto no layout raiz (Server Component), o tema nunca
// chegaria às páginas e o prerender quebrava em `theme.colors.*` (achado no
// `next build`). Envolvendo num Client Component, o provider de verdade é
// montado normalmente.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>;
}
