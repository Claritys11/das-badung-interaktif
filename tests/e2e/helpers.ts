import { expect, type Page, type TestInfo } from '@playwright/test';

/** Kumpulkan error console & pageerror; panggil `assertClean()` di akhir test. */
export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { assertClean: () => expect(errors, errors.join('\n')).toEqual([]) };
}

export async function shot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `tests/screenshots/${info.project.name}/${name}.jpg`, type: 'jpeg', quality: 70 });
}

export const activeStep = (page: Page) => page.locator('.das-sm__step.is-active').getAttribute('data-step');

/** Tunggu peta siap dan kamera selesai bergerak. */
export async function mapIdle(page: Page) {
  await expect(page.locator('.das-sm__map[data-ready]')).toBeVisible();
  await page.waitForFunction(
    () => {
      const m = (window as any).__dasMap;
      return m && !m.isMoving() && m.areTilesLoaded();
    },
    undefined,
    { timeout: 20_000 },
  );
}
