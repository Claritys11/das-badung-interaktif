import { expect, test } from '@playwright/test';
import { shot, watchConsole } from './helpers';
import { timeline } from '../../src/content/timeline';

const activeDate = (page: import('@playwright/test').Page) =>
  page.locator('.das-tl__day.is-active time').getAttribute('datetime');

test('timeline: kartu per tanggal, aktif mengikuti scroll, pop-up semua peristiwa', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/embed/timeline.html');
  const days = page.locator('.das-tl__day');
  await expect(days).toHaveCount(timeline.length);
  await expect(page.locator('.das-tl__day').first().locator('.das-tl__tally i')).toHaveCount(timeline[0].peristiwa.length);
  await shot(page, info, 'timeline-1-daftar');

  // Kartu aktif berpindah saat digulir (maju & mundur).
  await days.nth(4).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3));
  await expect.poll(() => activeDate(page)).toBe(timeline[4].tanggal);
  await days.nth(1).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3));
  await expect.poll(() => activeDate(page)).toBe(timeline[1].tanggal);

  // Klik kartu → pop-up berisi SEMUA peristiwa hari itu.
  await page.evaluate(() => window.scrollTo(0, 0));
  const opener = page.locator('.das-tl__open').first();
  await opener.click();
  const dialog = page.locator('dialog.das-tl-dialog[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.das-tl-dialog__events li')).toHaveCount(timeline[0].peristiwa.length);
  await expect(dialog.locator('time')).toHaveText(timeline[0].label);
  // Scroll halaman di belakang terkunci.
  await expect(page.locator('html')).toHaveClass(/das-tl-lock/);
  await shot(page, info, 'timeline-2-popup');

  // Navigasi hari di dalam pop-up.
  await expect(dialog.getByRole('button', { name: 'Hari sebelumnya' })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Hari berikutnya' }).click();
  await expect(dialog.locator('time')).toHaveText(timeline[1].label);
  await expect(dialog.locator('.das-tl-dialog__events li')).toHaveCount(timeline[1].peristiwa.length);

  // Esc menutup, fokus kembali ke tombol kartu pemicu, kunci scroll dilepas.
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/das-tl-lock/);

  // Klik di luar kotak (latar) juga menutup.
  await opener.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(dialog).toHaveCount(0);
  c.assertClean();
});

test('timeline: kartu bisa dibuka dengan keyboard', async ({ page }) => {
  await page.goto('/embed/timeline.html');
  await page.locator('.das-tl__open').nth(2).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog.das-tl-dialog[open] time')).toHaveText(timeline[2].label);
});

test('timeline: penanda jeda antar-tanggal berjauhan & label kartu satu peristiwa', async ({ page }) => {
  await page.goto('/embed/timeline.html');
  const gaps = page.locator('.das-tl__gap');
  // Satu penanda per pasangan tanggal yang berjarak > 7 hari.
  const expectedGaps = timeline.slice(1).filter((h, i) => (Date.parse(h.tanggal) - Date.parse(timeline[i].tanggal)) / 86400000 > 7).length;
  await expect(gaps).toHaveCount(expectedGaps);
  // Jeda panjang dihitung per kalender, bukan dibulatkan (9 Jan → 27 Jul 2026).
  if (timeline.some((h) => h.tanggal === '2026-07-27')) await expect(gaps.filter({ hasText: '6 bulan 18 hari kemudian' })).toHaveCount(1);
  // Kartu dengan satu peristiwa: "Baca selengkapnya"; lebih dari satu: "Lihat semua peristiwa".
  const i1 = timeline.findIndex((h) => h.peristiwa.length === 1);
  const iN = timeline.findIndex((h) => h.peristiwa.length > 1);
  await expect(page.locator('.das-tl__open').nth(i1)).toContainText('Baca selengkapnya');
  await expect(page.locator('.das-tl__open').nth(iN)).toContainText('Lihat semua peristiwa');
});
