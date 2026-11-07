// Paleta única do Troca Aula (P13 e P21 em docs/06-status/problemas-conhecidos.md).
//
// Duas escalas e as cores de estado:
// - verde-água: parte do verde do logo (#509BA1). Botões e links usam um tom
//   mais escuro (600) para o texto branco ficar legível;
// - neutros: cinzas puxados para o verde, para não brigar com a cor da marca;
// - sucesso / aviso / erro / informação, no mesmo tom sóbrio.
//
// Os componentes usam só `theme.colors.*` (nomes pelo PAPEL da cor). Para
// mudar a cara do sistema, mude os valores aqui. Contraste conferido pela
// WCAG AA: texto >= 4,5:1, contornos de campos e texto grande >= 3:1.
export const palette = {
  teal: {
    50: '#EFF7F7',
    100: '#D8EDEE',
    200: '#B2DADD',
    300: '#80C1C6',
    400: '#509BA1', // logo
    500: '#3B8288',
    600: '#2E6B70',
    700: '#25575B',
    800: '#1D4447',
    900: '#153235',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F4F7F7',
    100: '#EBF0F0',
    200: '#DCE3E4',
    300: '#C3CDCE',
    400: '#899799',
    500: '#5E6E71',
    600: '#4C5B5E',
    800: '#1F2B2D',
  },
} as const;

const { teal, neutral } = palette;

const status = {
  success: { bg: '#E7F4EC', text: '#2C7A4B', border: '#BFE3CC' },
  warning: { bg: '#FDF3E1', text: '#9A5B06', border: '#F2D7A6' },
  danger: { bg: '#FBEAE8', text: '#B23A30', border: '#F0C4BF' },
  info: { bg: '#E8F1FA', text: '#2A67A8', border: '#C3D9F0' },
} as const;

export const theme = {
  colors: {
    // Marca e ações principais
    brand: teal[400],
    primary: teal[600],
    primaryHover: teal[700],
    primarySoft: teal[50],
    primarySoftHover: teal[100],
    primaryBorder: teal[200],
    onPrimary: neutral[0],
    focus: teal[500],
    focusRing: 'rgba(59, 130, 136, 0.25)',

    // Menu lateral
    sidebar: teal[800],
    sidebarText: teal[100],
    sidebarSection: teal[300],
    sidebarHover: 'rgba(255, 255, 255, 0.08)',
    sidebarActive: 'rgba(255, 255, 255, 0.14)',

    // Texto
    text: neutral[800],
    textMuted: neutral[500],
    placeholder: neutral[400],

    // Superfícies e bordas
    background: neutral[50],
    surface: neutral[0],
    surfaceAlt: neutral[100],
    border: neutral[200],
    borderLight: neutral[100],
    borderStrong: neutral[400], // contorno de campos (3:1)
    disabled: neutral[300],
    overlay: 'rgba(21, 50, 53, 0.45)',

    // Tabelas
    tableHeader: teal[50],
    tableHeaderText: teal[800],
    rowHover: '#F7FAFA',

    // Estados
    success: status.success.text,
    successHover: '#23633C',
    successBg: status.success.bg,
    successBorder: status.success.border,
    warning: status.warning.text,
    warningBg: status.warning.bg,
    warningBorder: status.warning.border,
    danger: status.danger.text,
    dangerHover: '#962F27',
    dangerBg: status.danger.bg,
    dangerBorder: status.danger.border,
    info: status.info.text,
    infoBg: status.info.bg,
    infoBorder: status.info.border,
  },
  // Tons para etiquetas de status e avisos: fundo claro + texto forte.
  tones: {
    primary: { bg: teal[50], text: teal[700], border: teal[200] },
    neutral: { bg: neutral[100], text: neutral[600], border: neutral[200] },
    ...status,
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
  shadow: {
    card: '0 1px 2px rgba(21, 50, 53, 0.06), 0 1px 3px rgba(21, 50, 53, 0.08)',
    modal: '0 12px 32px rgba(21, 50, 53, 0.18)',
  },
} as const;

export type AppTheme = typeof theme;
