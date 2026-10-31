import { expect, test } from '@playwright/test';
import { shot, watchConsole } from './helpers';
import { sejarah } from '../../src/content/sejarah';

const keSegmen = (page: import('@playwright/test').Page, kunci: string) =>
  page.evaluate((k) => {
    // Awal segmen tepat melewati garis baca, seperti saat pembaca menggulir sampai ke sana.
    const panel = document.querySelector<HTMLElement>('.das-sj__panel')!.offsetHeight;
    const garis = innerWidth < 960 ? panel + (innerHeight - panel) * 0.45 : innerHeight * 0.62;
    const el = document.querySelector(`[data-segmen="${k}"]`)!;
    scrollTo(0, el.getBoundingClientRect().top + scrollY - garis + 4);
  }, kunci);

const opasitasPetaLama = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate((i) => (window as any).__sjMap.getPaintProperty(i, 'raster-opacity'), id);

test('sejarah: judul muncul saat di-scroll, media & masa peta mengikuti teks', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/embed/sejarah.html?debug');

  // Awalnya hanya gambar: judul ada di DOM tapi belum terlihat, video berjalan.
  const judul = page.locator('.das-sj__hero-teks');
  await expect(judul).toHaveCSS('opacity', '0');
  const video = page.locator('.das-sj__hero-video');
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime > 0 && !v.paused)).toBe(true);

  await page.evaluate(() => {
    const h = document.querySelector<HTMLElement>('.das-sj__hero')!;
    scrollTo(0, (h.offsetHeight - innerHeight) * 0.7);
  });
  await expect(judul).toHaveCSS('opacity', '1');
  await expect(page.getByRole('heading', { name: 'Sejarah Tata Ruang Kota Pusaka' })).toBeVisible();
  await expect(judul.locator('em')).toHaveText('Leiden University Libraries');

  // Tombol jeda menghentikan video.
  await page.getByRole('button', { name: 'Jeda video' }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await page.getByRole('button', { name: 'Putar video' }).click();
  await shot(page, info, 'sejarah-hero');

  await expect(page.locator('.das-sj__bab')).toHaveCount(sejarah.length);

  // Peta masa kini → kerajaan (penanda dari KMZ).
  await keSegmen(page, 'tapak-dara-0');
  await expect(page.locator('.das-sj__peta[data-ready]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.das-sj__era [aria-current="true"]')).toHaveText('Sekarang');
  await expect(page.locator('.das-sj__penanda', { hasText: 'Jaya Sabha' })).toBeVisible();
  await keSegmen(page, 'tapak-dara-1');
  await expect(page.locator('.das-sj__era [aria-current="true"]')).toHaveText('Kerajaan');
  await expect(page.locator('.das-sj__penanda', { hasText: 'Puri Agung Denpasar' })).toBeVisible();
  await shot(page, info, 'sejarah-kerajaan');

  // Foto → peta 1915; peta lama benar-benar tampil, slider menipiskannya.
  await keSegmen(page, '1906-0');
  await expect(page.locator('.das-sj__foto.is-aktif')).toHaveAttribute('data-foto', 'puri-denpasar');
  await expect(page.locator('.das-sj__foto.is-aktif img')).toHaveJSProperty('complete', true);
  await keSegmen(page, '1906-1');
  await expect(page.locator('.das-sj__foto.is-aktif')).toHaveCount(0);
  await expect(page.locator('.das-sj__era [aria-current="true"]')).toHaveText('1915');
  await expect.poll(() => opasitasPetaLama(page, 'sj-1915')).toBe(1);
  await page.locator('.das-sj__tebal input').fill('40');
  await expect.poll(() => opasitasPetaLama(page, 'sj-1915')).toBe(0.4);
  await shot(page, info, 'sejarah-1915');

  // Tombol masa peta membawa pembaca ke teksnya.
  await page.getByRole('button', { name: '1930', exact: true }).click();
  await expect(page.locator('.das-sj__era [aria-current="true"]')).toHaveText('1930');
  await expect.poll(() => opasitasPetaLama(page, 'sj-1930')).toBe(1);
  await expect.poll(() => opasitasPetaLama(page, 'sj-1915')).toBe(0);

  // Foto terakhir & kalimat penutup.
  await keSegmen(page, 'heritage-0');
  await expect(page.locator('.das-sj__foto.is-aktif')).toHaveAttribute('data-foto', 'jalan-gajah-mada');
  await page.locator('.das-sj__penutup').scrollIntoViewIfNeeded();
  await expect(page.locator('.das-sj__penutup')).toContainText('Lebih baik dirobohkan');
  await shot(page, info, 'sejarah-penutup');
  c.assertClean();
});

test('sejarah: peta tidak mengintip saat foto berganti ke foto lain', async ({ page }) => {
  await page.goto('/embed/sejarah.html');
  // Font yang selesai dimuat menggeser teks, jadi posisi scroll baru bisa dipercaya setelahnya.
  await page.evaluate(() => document.fonts.ready);
  const foto = page.locator('.das-sj__foto.is-aktif');
  await expect(async () => {
    await keSegmen(page, 'infrastruktur-0');
    await expect(foto).toHaveAttribute('data-foto', 'catur-muka', { timeout: 1000 });
  }).toPass();
  await expect(foto).toHaveCSS('opacity', '1');

  const tutupanTerendah = () =>
    page.evaluate(
      () =>
        new Promise<number>((selesai) => {
          // Setiap frame: seberapa rapat gabungan semua foto menutupi peta (1 = peta tak terlihat sama sekali).
          const semua = [...document.querySelectorAll<HTMLElement>('.das-sj__foto')];
          let terendah = 1;
          const mulai = performance.now();
          const frame = () => {
            const lolos = semua.reduce((sisa, f) => sisa * (1 - Number(getComputedStyle(f).opacity)), 1);
            terendah = Math.min(terendah, 1 - lolos);
            if (performance.now() - mulai < 900) requestAnimationFrame(frame);
            else selesai(terendah);
          };
          frame();
        }),
    );

  const maju = tutupanTerendah();
  await keSegmen(page, 'aktivitas-0');
  expect(await maju).toBeGreaterThan(0.99);
  await expect(foto).toHaveAttribute('data-foto', 'pasar-badung');

  const mundur = tutupanTerendah();
  await keSegmen(page, 'infrastruktur-0');
  expect(await mundur).toBeGreaterThan(0.99);
  await expect(foto).toHaveAttribute('data-foto', 'catur-muka');
});

test('sejarah: gerak dikurangi → judul langsung tampil, video tidak berjalan sendiri', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/embed/sejarah.html');
  await expect(page.locator('.das-sj__hero-teks')).toHaveCSS('opacity', '1');
  const video = page.locator('.das-sj__hero-video');
  await expect(video).toBeAttached();
  await page.waitForTimeout(800);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await expect(page.getByRole('button', { name: 'Putar video' })).toBeVisible();
});
