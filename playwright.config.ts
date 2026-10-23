import { defineConfig, devices } from '@playwright/test';

// Testes de ponta a ponta (front + backend + Postgres de verdade).
// Como rodar e o que cada arquivo cobre: e2e/README.md.

const API_PORT = Number(process.env.E2E_API_PORT ?? 5055);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3055);
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // SLOWMO=500 deixa cada ação 0,5s mais lenta (para assistir com --headed).
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Recria o banco de teste, aplica migrations + SQL base e sobe a API.
      command: 'bash e2e/scripts/subir-backend.sh',
      url: `http://localhost:${API_PORT}/health`,
      timeout: 240_000,
      reuseExistingServer: !CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'bash e2e/scripts/subir-front.sh',
      url: `http://localhost:${WEB_PORT}`,
      timeout: 300_000,
      reuseExistingServer: !CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
