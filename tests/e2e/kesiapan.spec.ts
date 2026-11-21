import { expect, test } from '@playwright/test';
import { shot, watchConsole } from './helpers';
import { kesiapan } from '../../src/content/kesiapan';

test('kesiapan: 26 langkah dipecah per kelompok, centang dihitung per kelompok', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/embed/kesiapan.html');
  const kartu = page.locator('.das-ks .das-ds__ceklis');
  await expect(kartu).toHaveCount(kesiapan.length);
  await expect(page.locator('.das-ks').getByRole('checkbox')).toHaveCount(26);
  // Tidak ada judul bagian maupun petunjuk: bagian ini langsung dibuka dengan kartu.
  await expect(page.locator('.das-ks h2')).toHaveCount(0);
  await expect(page.getByText('Centang langkah yang sudah berjalan')).toHaveCount(0);
  expect(new Set(kesiapan.flatMap((k) => k.item)).size).toBe(26);

  const sungai = kartu.filter({ hasText: 'Sungai dan lingkungan' });
  await sungai.getByText('Buat kolam retensi dan ruang hijau').click();
  await expect(sungai.locator('.das-ds__progres-teks')).toHaveText('1 dari 5 langkah sudah dilakukan');
  await expect(kartu.filter({ hasText: 'Cagar budaya' }).locator('.das-ds__progres-teks')).toHaveText('0 dari 3 langkah sudah dilakukan');

  // Semua isi terlihat tanpa gulir di dalam kartu, dan halaman tidak melebar.
  for (const k of await kartu.all()) {
    const ul = k.locator('ul');
    expect(await ul.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await shot(page, info, 'kesiapan');
  c.assertClean();
});

test('kesiapan: berada di paling bawah artikel, setelah visual sejarah', async ({ page }) => {
  await page.goto('/');
  const urutan = await page.evaluate(() => {
    const y = (s: string) => document.querySelector(s)!.getBoundingClientRect().top;
    return { sejarah: y('.das-sj'), disabilitas: y('.das-ds'), kesiapan: y('.das-ks') };
  });
  expect(urutan.disabilitas).toBeLessThan(urutan.sejarah);
  expect(urutan.sejarah).toBeLessThan(urutan.kesiapan);
});
