import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Config flat nativa do eslint-config-next 16 (ESLint 10). A versão anterior
// usava FlatCompat + `extends` no formato antigo (eslintrc), que o ESLint 10
// não aceita mais — `pnpm run lint` quebrava com "Converting circular
// structure to JSON" (achado ao reativar as regras no P8).
const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.next/**',
      'out/**',
      '*.min.js',
      'next-env.d.ts',
    ],
  },

  // Extensões padrão do Next.js (core-web-vitals + typescript), já em flat config.
  ...nextVitals,
  ...nextTs,

  // Customizações do projeto.
  {
    rules: {
      // Permite variáveis não utilizadas (ex: NextRequest, error, index)
      '@typescript-eslint/no-unused-vars': 'off',

      // 2 e 3 (no-explicit-any/ban-ts-comment) reativadas (P8,
      // problemas-conhecidos.md): o código de aplicação não usa mais nenhum
      // `any`/`@ts-ignore` — as regras ficam ligadas e só são afrouxadas
      // dentro de `tests/**` (objeto abaixo).

      // Desativa o aviso de dependências do useEffect (evita ruído no build)
      'react-hooks/exhaustive-deps': 'off',

      // O padrão de carregamento do projeto é "buscar no effect e setar o
      // estado" (hooks de dados). A regra nova do react-hooks v6 sinaliza
      // isso como cascading render — é o padrão adotado de propósito aqui,
      // então fica desligada como a exhaustive-deps.
      'react-hooks/set-state-in-effect': 'off',

      // Regra do Next que não se aplica ao padrão de navegação do projeto
      '@next/next/no-html-link-for-pages': 'off',
    },
  },

  // Arquivos de teste: mocks legitimamente precisam de `any`/`@ts-ignore`
  // pontuais (ex.: `jest.fn() as any`, simular um payload malformado de
  // propósito) - sem afrouxar isso pro código de aplicação real.
  {
    files: ['tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
];

export default eslintConfig;
