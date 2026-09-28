import { expect, test, type Page } from '@playwright/test';
import { activeStep, shot, watchConsole } from './helpers';

const phase = (page: Page) => page.locator('.das-ft').getAttribute('data-phase');
const stageTransform = (page: Page) => page.locator('.das-ft__stage').evaluate((el) => getComputedStyle(el).transform);
const afterOpacity = (page: Page) => page.locator('.das-ft__after').evaluate((el) => Number(getComputedStyle(el).opacity));

test('banjir (iframe peta): sebelum → getar → sesudah → peta, lalu mundur', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/embed/peta.html?debug');
  await expect(page.locator('.das-ft__photo img').first()).toHaveJSProperty('complete', true);
  expect(await phase(page)).toBe('sebelum');
  await expect(page.locator('.das-ft__tag')).toHaveText('Sebelum');
  await expect(page.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled();
  // Selama di intro, tidak ada titik progres peta yang aktif.
  await expect(page.locator('.das-sm__dots [aria-current]')).toHaveCount(0);
  await shot(page, info, 'banjir-1-sebelum');

  await page.getByRole('button', { name: 'Berikutnya' }).click();
  await expect.poll(() => phase(page)).toBe('sesudah');
  // Getaran berjalan: panggung sempat bergeser (transform bukan identitas).
  await expect.poll(() => stageTransform(page), { timeout: 2000, intervals: [30] }).not.toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await expect(page.locator('.das-ft__tag')).toHaveText('Sesudah');
  await expect.poll(() => afterOpacity(page)).toBe(1);
  await expect.poll(() => stageTransform(page)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/); // getar selesai
  await shot(page, info, 'banjir-2-sesudah');

  // Berikutnya → step pertama peta.
  await page.getByRole('button', { name: 'Berikutnya' }).click();
  await expect.poll(() => activeStep(page)).toBe('bali');
  await expect(page.locator('.das-sm__dots [aria-current="step"]')).toHaveCount(1);

  // Mundur: kembali ke foto sesudah, lalu sebelum (tanpa getar saat mundur).
  await page.getByRole('button', { name: 'Sebelumnya' }).click();
  await expect.poll(() => phase(page)).toBe('sesudah');
  await page.getByRole('button', { name: 'Sebelumnya' }).click();
  await expect.poll(() => phase(page)).toBe('sebelum');
  expect(await stageTransform(page)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await expect.poll(() => afterOpacity(page)).toBe(0);
  c.assertClean();
});

test('banjir (halaman penuh / harness): scroll melewati titik tengah memicu sesudah, scroll balik ke sebelum', async ({ page }) => {
  const c = watchConsole(page);
  await page.goto('/');
  const ft = page.locator('.das-ft');
  await ft.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await expect.poll(() => phase(page)).toBe('sebelum');
  // Lompat langsung melewati sentinel (meniru scroll cepat) → tetap terdeteksi.
  await ft.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().height * 0.6));
  await expect.poll(() => phase(page)).toBe('sesudah');
  await ft.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await expect.poll(() => phase(page)).toBe('sebelum');
  c.assertClean();
});

test('banjir: reduced motion → tanpa getar, foto sesudah langsung tampil', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/embed/peta.html');
  await expect(page.locator('.das-ft__photo img').first()).toHaveJSProperty('complete', true);
  await page.getByRole('button', { name: 'Berikutnya' }).click();
  await expect.poll(() => phase(page)).toBe('sesudah');
  for (let i = 0; i < 5; i++) {
    expect(await stageTransform(page)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    await page.waitForTimeout(60);
  }
  expect(await afterOpacity(page)).toBe(1);
});
