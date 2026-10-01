import { expect, test, type Page } from '@playwright/test';
import { activeStep, shot, watchConsole } from './helpers';
import { banjirTeks } from '../../src/content/banjir';

const IDENTITY = /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/;
const tahapan = banjirTeks.tahapan;
const climax = tahapan.findIndex((t) => t.meluap);

const phase = (page: Page) => page.locator('.das-ft').getAttribute('data-phase');
const stage = (page: Page) => page.locator('.das-ft').getAttribute('data-stage');
const stickyTransform = (page: Page) => page.locator('.das-ft__sticky').evaluate((el) => getComputedStyle(el).transform);
const afterOpacity = (page: Page) => page.locator('.das-ft__after').evaluate((el) => Number(getComputedStyle(el).opacity));
// Angka akhir kartu (bagian untuk pembaca layar = nilai akhir, bukan angka yang sedang dihitung).
const cardNumber = (page: Page) => page.locator('.das-ft-card__angka .das-visually-hidden').innerText();
const next = (page: Page) => page.getByRole('button', { name: 'Berikutnya' }).click();
const prev = (page: Page) => page.getByRole('button', { name: 'Sebelumnya' }).click();

test('banjir (iframe peta): tahap data → meluap (getar + air bah) → sesudah → peta, lalu mundur', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/embed/peta.html?debug');
  await expect(page.locator('.das-ft__photo img').first()).toHaveJSProperty('complete', true);
  expect(await stage(page)).toBe('hujan');
  expect(await phase(page)).toBe('sebelum');
  await expect(page.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled();
  await expect(page.locator('.das-sm__dots [aria-current]')).toHaveCount(0);
  await expect.poll(() => cardNumber(page)).toBe('245,5–385,5');
  await shot(page, info, 'banjir-1-hujan');

  // Tahap sebelum klimaks: angka sesuai data, foto masih "sebelum", muka air naik.
  const expected: Record<string, string> = { atmosfer: '9–10 Sept 2025', limpasan: '0,412 → 0,466', debit: '85,85' };
  for (let i = 1; i < climax; i++) {
    await next(page);
    await expect.poll(() => stage(page)).toBe(tahapan[i].id);
    expect(await phase(page)).toBe('sebelum');
    if (expected[tahapan[i].id]) await expect.poll(() => cardNumber(page)).toBe(expected[tahapan[i].id]);
  }
  await expect
    .poll(() => page.locator('.das-ft__level').evaluate((el) => el.getBoundingClientRect().top < window.innerHeight * 0.9))
    .toBe(true);
  await shot(page, info, 'banjir-2-debit');

  // Klimaks: getar + air bah layar penuh, foto berganti ke sesudah.
  await next(page);
  await expect.poll(() => stage(page)).toBe('meluap');
  expect(await phase(page)).toBe('sesudah');
  await expect.poll(() => stickyTransform(page), { timeout: 2000, intervals: [30] }).not.toMatch(IDENTITY);
  await expect(page.locator('.das-ft__fx')).toHaveCount(1);
  // Air bah menutup seluruh lebar layar, bukan hanya bingkai foto.
  const fxWidth = await page.locator('.das-ft__fx').evaluate((el) => el.getBoundingClientRect().width);
  expect(fxWidth).toBeGreaterThanOrEqual(page.viewportSize()!.width - 2);
  await expect(page.locator('.das-ft__tag')).toHaveText('Sesudah');
  await expect.poll(() => cardNumber(page)).toBe('±2.296');
  await expect.poll(() => afterOpacity(page)).toBe(1);
  await expect.poll(() => stickyTransform(page)).toMatch(IDENTITY);
  await expect(page.locator('.das-ft__fx')).toHaveCount(0, { timeout: 4000 });
  await shot(page, info, 'banjir-3-sesudah');

  // Tahap sesudah → step pertama peta.
  await next(page);
  await expect.poll(() => stage(page)).toBe('sesudah');
  await next(page);
  await expect.poll(() => activeStep(page)).toBe('bali');
  await expect(page.locator('.das-sm__dots [aria-current="step"]')).toHaveCount(1);

  // Mundur melewati klimaks: tanpa getar/efek, kembali ke foto sebelum.
  await prev(page);
  await expect.poll(() => stage(page)).toBe('sesudah');
  await prev(page);
  await expect.poll(() => stage(page)).toBe('meluap');
  await prev(page);
  await expect.poll(() => stage(page)).toBe('debit');
  expect(await phase(page)).toBe('sebelum');
  expect(await stickyTransform(page)).toMatch(IDENTITY);
  await expect(page.locator('.das-ft__fx')).toHaveCount(0);
  await expect.poll(() => afterOpacity(page)).toBe(0);
  c.assertClean();
});

test('banjir (halaman penuh / harness): tahap mengikuti scroll halaman, maju & mundur', async ({ page }) => {
  const c = watchConsole(page);
  await page.goto('/');
  const ft = page.locator('.das-ft');
  const goStage = (i: number) =>
    ft.evaluate((el, i) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + i * window.innerHeight), i);
  // Regresi: di halaman artikel (latar krem), teks di section banjir yang gelap harus tetap terang.
  // Dulu angka besar & petunjuk scroll mewarisi warna gelap .das-root → hitam di atas hitam.
  await goStage(0);
  const luminance = (sel: string) =>
    page
      .locator(sel)
      .first()
      .evaluate((el) => {
        const [r, g, b] = getComputedStyle(el)
          .color.match(/\d+(\.\d+)?/g)!
          .map(Number);
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      });
  for (const sel of ['.das-ft-card__angka', '.das-ft-card__teks', '.das-ft__hint', '.das-ft__caption']) {
    await expect.poll(() => luminance(sel), { message: sel }).toBeGreaterThan(0.7);
  }
  for (const i of [0, 2, climax, tahapan.length - 1, 1, 0]) {
    await goStage(i);
    await expect.poll(() => stage(page)).toBe(tahapan[i].id);
    expect(await phase(page)).toBe(i >= climax ? 'sesudah' : 'sebelum');
  }
  c.assertClean();
});

test('banjir: reduced motion → tanpa getar & tanpa air bah, foto sesudah langsung tampil', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/embed/peta.html');
  await expect(page.locator('.das-ft__photo img').first()).toHaveJSProperty('complete', true);
  await page.evaluate(() => document.querySelector('[data-nav-stop="banjir-debit"]')!.scrollIntoView({ block: 'start' }));
  await expect.poll(() => stage(page)).toBe('debit');
  await next(page);
  await expect.poll(() => stage(page)).toBe('meluap');
  for (let i = 0; i < 5; i++) {
    expect(await stickyTransform(page)).toMatch(IDENTITY);
    await expect(page.locator('.das-ft__fx')).toHaveCount(0);
    await page.waitForTimeout(60);
  }
  expect(await afterOpacity(page)).toBe(1);
  await expect(page.locator('.das-ft-card__angka .das-visually-hidden')).toHaveText('±2.296');
});
