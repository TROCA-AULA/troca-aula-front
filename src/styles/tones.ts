import { css } from 'styled-components';
import type { AppTheme } from './theme';

export type Tone = keyof AppTheme['tones'];

/** Fundo, texto e borda de um tom do tema (etiquetas de status, avisos). */
export const toneCss = (tone: Tone) => css`
  background-color: ${({ theme }) => theme.tones[tone].bg};
  color: ${({ theme }) => theme.tones[tone].text};
  border: 1px solid ${({ theme }) => theme.tones[tone].border};
`;
