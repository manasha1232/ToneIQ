import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:   './e2e',
  timeout:   30_000,
  use: {
    baseURL:    'http://localhost:5173',
    headless:    true,
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command:          'npm run dev',
      url:              'http://localhost:5173',
      reuseExistingServer: true,
      cwd:              '.',
    },
    {
      command:          'npm run dev',
      url:              'http://localhost:3001/health',
      reuseExistingServer: true,
      cwd:              '../backend',
    },
  ],
});
