import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 120_000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'off',
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'report' }]],
});
