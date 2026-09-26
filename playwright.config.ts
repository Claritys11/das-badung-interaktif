import { defineConfig, devices } from '@playwright/test';

// E2E terhadap build produksi (vite preview). Memakai Chrome sistem (channel "chrome"),
// jadi tidak perlu mengunduh browser Playwright. WebGL2 via SwiftShader saat headless.
const chrome = {
  channel: 'chrome' as const,
  launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { ...chrome, viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { ...chrome, viewport: { width: 834, height: 1112 }, hasTouch: true } },
    { name: 'mobile', use: { ...chrome, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
});
