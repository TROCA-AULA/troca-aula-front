import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test-setup.ts',
        'src/test-utils.tsx',
        'src/app/layout.tsx', // Boilerplate de layout é difícil de testar no JSDOM (html/body)
        'src/app/api/auth/me/route.ts', // Exemplo: rotas de API podem ser difíceis se não houver um bom mocking do NextRequest
        'src/app/api/auth/logout/route.ts',
        'src/app/api/auth/login/route.ts',
        'src/app/api/classes/route.ts',
        'src/app/api/classes/[id]/route.ts',
        'src/lib/registry.tsx', // Boilerplate para styled-components no Next.js
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
