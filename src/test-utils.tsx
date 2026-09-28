import { render as rtlRender } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';

// Componentes que usam `styled-components` com `props.theme` (ver
// src/components/ui/AdminTable.tsx) quebram em teste sem um ThemeProvider
// na árvore - a app real sempre tem um (src/app/layout.tsx), mas
// `@testing-library/react`'s render() isolado não. Reexporta tudo de RTL,
// só substituindo `render`.
export * from '@testing-library/react';

export function render(ui: ReactElement) {
  return rtlRender(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}
