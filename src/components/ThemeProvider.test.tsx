import { render, screen } from '@/test-utils';
import { describe, it, expect } from 'vitest';
import { useTheme } from 'styled-components';
import { ThemeProvider } from './ThemeProvider';
import { theme } from '@/styles/theme';

function ThemeProbe() {
  const currentTheme = useTheme();
  return <span data-testid="primary">{currentTheme.colors.primary}</span>;
}

describe('ThemeProvider', () => {
  it('disponibiliza o tema do projeto para os filhos', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('primary')).toHaveTextContent(theme.colors.primary);
  });
});
