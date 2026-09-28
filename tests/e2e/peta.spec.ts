import { expect, test, type Page } from '@playwright/test';
import { activeStep, mapIdle, shot, watchConsole } from './helpers';
import { story } from '../../src/content/story';

/**
 * Klik titik banjir langsung di kanvas (posisi piksel dihitung dari koordinat).
 * Titik yang bertumpuk: klik pertama men-zoom ke kumpulan titik, klik berikutnya memilih —
 * jadi klik diulang (maks. 3×) sampai panel detail muncul, persis seperti pengguna.
 */
async function clickPoint(page: Page, nama: string) {
  for (let i = 0; i < 3; i++) {
    const xy = await page.evaluate((n) => {
      const m = (window as any).__dasMap;
      const f = m.querySourceFeatures('banjir').find((x: any) => x.properties.nama === n);
      const p = m.project(f.geometry.coordinates);
      const r = m.getCanvas().getBoundingClientRect();
      return { x: r.left + p.x, y: r.top + p.y };
    }, nama);
    await page.mouse.click(xy.x, xy.y);
    await mapIdle(page);
    if (await page.locator('.das-sm__detail').count()) return;
  }
}

test('peta (iframe/internal): semua step, klik titik, reset, scroll mundur', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/embed/peta.html?debug&intro=0');
  await mapIdle(page);
  await shot(page, info, `peta-1-${story[0].id}`);

  for (let i = 1; i < story.length; i++) {
    await page.getByRole('button', { name: 'Berikutnya' }).click();
    await expect.poll(() => activeStep(page)).toBe(story[i].id);
    await mapIdle(page);
    await shot(page, info, `peta-${i + 1}-${story[i].id}`);
  }
  await expect(page.getByRole('button', { name: 'Berikutnya' })).toBeDisabled();

  // Kembali ke step titik banjir lalu klik titik yang punya deskripsi KMZ.
  await page.getByRole('button', { name: 'Sebelumnya' }).click();
  await expect.poll(() => activeStep(page)).toBe('banjir');
  await mapIdle(page);
  await clickPoint(page, 'Jalan Pulau Misol');
  const detail = page.locator('.das-sm__detail');
  await expect(detail.locator('h3')).toHaveText('Jalan Pulau Misol');
  await expect(detail).toContainText('Ketinggian air sepinggang orang dewasa');
  await expect(detail).toContainText('Keterangan dari data lapangan');
  await mapIdle(page);
  expect(await page.evaluate(() => (window as any).__dasMap.getZoom())).toBeGreaterThan(14.5);
  await shot(page, info, 'peta-detail-kmz');

  // Titik lain → placeholder berbeda.
  await page.getByRole('button', { name: 'Kembali ke tampilan cerita' }).click();
  await expect(detail).toHaveCount(0);
  await mapIdle(page);
  expect(await page.evaluate(() => (window as any).__dasMap.getZoom())).toBeLessThan(13.5);
  await clickPoint(page, 'Pasar Badung');
  await expect(detail).toContainText('[Penjelasan titik Pasar Badung — diisi redaksi]');
  await mapIdle(page);
  await shot(page, info, 'peta-detail-placeholder');

  // Ganti step saat detail terbuka → detail tertutup.
  await page.getByRole('button', { name: 'Berikutnya' }).click();
  await expect.poll(() => activeStep(page)).toBe('penutup');
  await expect(detail).toHaveCount(0);

  // Scroll mundur ke atas → step 1, layer data tersembunyi lagi.
  await page.locator('.das-sm--internal').evaluate((el) => el.scrollTo({ top: 0 }));
  await expect.poll(() => activeStep(page)).toBe('bali');
  await mapIdle(page);
  const opacity = await page.evaluate(() => (window as any).__dasMap.getPaintProperty('banjir-circle', 'circle-opacity'));
  expect(opacity).toBe(0);
  c.assertClean();
});

test('peta (halaman penuh / harness): scroll maju-mundur mengubah step', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/?debug');
  const steps = page.locator('.das-sm__step');
  for (const i of [0, 2, 4, 1, 0]) {
    await steps.nth(i).evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await expect.poll(() => activeStep(page)).toBe(story[i].id);
  }
  await mapIdle(page);
  await shot(page, info, 'harness-peta');
  c.assertClean();
});

test('peta: reduced motion tetap berfungsi (tanpa animasi)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/embed/peta.html?debug&intro=0');
  await mapIdle(page);
  await page.getByRole('button', { name: 'Berikutnya' }).click();
  await expect.poll(() => activeStep(page)).toBe('das');
  // jumpTo → kamera langsung di tujuan tanpa animasi.
  await expect
    .poll(() => page.evaluate(() => (window as any).__dasMap.getZoom()))
    .toBeCloseTo(story[1].cameraMobile && page.viewportSize()!.width < 768 ? story[1].cameraMobile.zoom! : story[1].camera.zoom, 1);
});

test('peta: klik titik progres terakhir langsung ke step akhir tanpa mengaktifkan step perantara', async ({ page }) => {
  await page.goto('/embed/peta.html?debug&intro=0');
  await mapIdle(page);
  await page.evaluate(() => {
    (window as any).__visited = [];
    new MutationObserver(() => {
      const s = document.querySelector('.das-sm__step.is-active')?.getAttribute('data-step');
      const v = (window as any).__visited;
      if (s && v[v.length - 1] !== s) v.push(s);
    }).observe(document.querySelector('.das-sm__steps')!, { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  await page.getByRole('button', { name: `Bagian ${story.length} dari ${story.length}` }).click();
  await expect.poll(() => activeStep(page)).toBe(story[story.length - 1].id);
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => (window as any).__visited)).toEqual([story[story.length - 1].id]);
});
