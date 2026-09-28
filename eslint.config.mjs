import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", "*.min.js"],
  },
  // Mantém as extensões padrões do Next.js
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Adiciona este objeto para customizar as regras
  {
    rules: {
      // 1. Permite variáveis não utilizadas (ex: NextRequest, error, index)
      "@typescript-eslint/no-unused-vars": "off",

      // 2 e 3 reativadas (P8, problemas-conhecidos.md): o código real não
      // usava mais nenhum `any`/`@ts-ignore` fora de arquivos de teste -
      // manter essas regras desligadas globalmente escondia regressões
      // futuras. `no-explicit-any`/`ban-ts-comment` off só dentro de
      // `tests/**`, onde mocks legitimamente precisam de tipagem solta.

      // 4. Desativa o aviso de dependências do useEffect (opcional, mas evita erros no build)
      "react-hooks/exhaustive-deps": "off",

      // 5. Se o ESLint reclamar de regras do Next especificamente:
      "@next/next/no-html-link-for-pages": "off"
    },
  },

  // Arquivos de teste: mocks legitimamente precisam de `any`/`@ts-ignore`
  // pontuais (ex.: `jest.fn() as any`, simular um payload malformado de
  // propósito) - sem afrouxar isso pro código de aplicação real.
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];

export default eslintConfig;
