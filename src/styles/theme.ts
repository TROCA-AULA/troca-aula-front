// P13 (problemas-conhecidos.md): antes, cada tela definia sua própria
// paleta de cores hardcoded (styled-components repetidos, ligeiramente
// divergentes entre telas). Este arquivo não inventa uma paleta nova - só
// nomeia semanticamente as cores que já eram usadas de forma consistente
// nas telas mais recentes (área /master e /escola), para virarem a fonte
// única daqui em diante.
export const theme = {
  colors: {
    primary: '#1e3a5f',
    primaryHover: '#2a4a73',
    accent: '#509BA1',
    accentHover: '#6EC3C9',
    focus: '#4a90d9',
    danger: '#c62828',
    dangerBg: '#ffebee',
    success: '#2e7d32',
    successBg: '#e8f5e9',
    warning: '#e65100',
    warningBg: '#fff3e0',
    info: '#1976d2',
    infoBg: '#e3f2fd',
    text: '#333',
    textMuted: '#666',
    border: '#ddd',
    borderLight: '#eee',
    background: '#f5f5f5',
    surface: '#fff',
    surfaceAlt: '#f8f9fa',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
  shadow: {
    card: '0 1px 3px rgba(0, 0, 0, 0.1)',
    modal: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
} as const;

export type AppTheme = typeof theme;
