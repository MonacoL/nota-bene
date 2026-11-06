import { defineConfig, devices } from '@playwright/test';

// Le 11 configurazioni della ricerca "Test responsive e visual regression in CI".
// Il nome finisce con il motore, così la CI lancia un job per motore con --project="*-<motore>".
// `screenshot` dice in quali lingue si scattano gli screenshot di confronto su quella configurazione.
type Screenshot = { screenshot?: 'it' | 'it+en' };

const PORTA = 4321;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : [['list']],
  // Un solo set di baseline, quello Linux dell'immagine Docker di Playwright: niente {platform} nel nome.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORTA}/nota-bene/`,
    trace: 'retain-on-failure',
    contextOptions: { reducedMotion: 'reduce' },
  },
  webServer: {
    command: `npx astro preview --ignore-lock --host 127.0.0.1 --port ${PORTA}`,
    url: `http://127.0.0.1:${PORTA}/nota-bene/it/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'phone-320-webkit', use: { ...devices['iPhone SE'] } },
    { name: 'phone-360-chromium', use: { ...devices['Galaxy S8'] }, metadata: { screenshot: 'it+en' } satisfies Screenshot },
    { name: 'iphone-webkit', use: { ...devices['iPhone 15'] }, metadata: { screenshot: 'it' } satisfies Screenshot },
    { name: 'phone-large-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'phone-360-firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 360, height: 740 } } },
    { name: 'tablet-webkit', use: { ...devices['iPad Mini'] }, metadata: { screenshot: 'it' } satisfies Screenshot },
    { name: 'tablet-landscape-webkit', use: { ...devices['iPad Mini landscape'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] }, metadata: { screenshot: 'it+en' } satisfies Screenshot },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] }, metadata: { screenshot: 'it' } satisfies Screenshot },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'desktop-wide-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } }, metadata: { screenshot: 'it' } satisfies Screenshot },
  ],
});
