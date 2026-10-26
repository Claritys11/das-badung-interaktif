import { expect, test, type Page } from '@playwright/test';
import { activeStep, mapIdle, shot, watchConsole } from './helpers';
import { story } from '../../src/content/story';

/**
 * Klik titik banjir langsung di kanvas (posisi piksel dihitung dari koordinat).
 * Titik yang bertumpuk: klik pertama men-zoom ke kumpulan titik, klik berikutnya memilih —
 * jadi klik diulang (maks. 3×) sampai nama tempat muncul, persis seperti pengguna.
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
    if (await page.locator('.das-sm__tooltip--selected').count()) return;
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

  // Step terakhir (penutup) titiknya bisa diklik → nama tempat tampil, kamera tidak pindah.
  const zoomAwal = await page.evaluate(() => (window as any).__dasMap.getZoom());
  await clickPoint(page, 'Jalan Pulau Misol');
  const nama = page.locator('.das-sm__tooltip--selected');
  await expect(nama).toHaveText('Jalan Pulau Misol');
  await shot(page, info, 'peta-nama-titik');

  // Reset → nama tertutup, kamera kembali ke tampilan cerita.
  await page.getByRole('button', { name: 'Kembali ke tampilan cerita' }).click();
  await expect(nama).toHaveCount(0);
  await mapIdle(page);
  expect(await page.evaluate(() => (window as any).__dasMap.getZoom())).toBeCloseTo(zoomAwal, 1);

  // Ganti step saat titik terpilih → pilihan dilepas.
  await clickPoint(page, 'Jalan Pulau Misol');
  await expect(nama).toHaveCount(1);
  await page.getByRole('button', { name: 'Sebelumnya' }).click();
  await expect.poll(() => activeStep(page)).toBe('sungai');
  await expect(nama).toHaveCount(0);

  // Step sungai: garis menjalar lalu tampil penuh.
  await expect
    .poll(() => page.evaluate(() => (window as any).__dasMap.getPaintProperty('sungai-line', 'line-opacity')), { timeout: 20_000 })
    .toBe(1);

  // Scroll mundur ke atas → step 1: choropleth tampil, titik banjir tersembunyi lagi.
  await page.locator('.das-sm--internal').evaluate((el) => el.scrollTo({ top: 0 }));
  await expect.poll(() => activeStep(page)).toBe(story[0].id);
  await mapIdle(page);
  const opacity = await page.evaluate(() => (window as any).__dasMap.getPaintProperty('banjir-circle', 'circle-opacity'));
  expect(opacity).toBe(0);
  expect(await page.evaluate(() => (window as any).__dasMap.getPaintProperty('kab-fill', 'fill-opacity'))).toBeGreaterThan(0.5);
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
  // Step DAS (zoom kabupaten/kota; step pulau bisa dibatasi maxBounds di layar sempit).
  const i = story.findIndex((s) => s.id === 'das');
  await page.getByRole('button', { name: `Bagian ${i + 1} dari ${story.length}` }).click();
  await expect.poll(() => activeStep(page)).toBe('das');
  // jumpTo → kamera langsung di tujuan tanpa animasi.
  await expect
    .poll(() => page.evaluate(() => (window as any).__dasMap.getZoom()))
    .toBeCloseTo(story[i].cameraMobile && page.viewportSize()!.width < 768 ? story[i].cameraMobile.zoom! : story[i].camera.zoom, 1);
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

test('peta: scroll cepat melewati step sungai — garis tetap tumbuh halus sampai penuh, tidak melompat', async ({ page }) => {
  await page.goto('/embed/peta.html?debug&intro=0');
  await mapIdle(page);
  const iSungai = story.findIndex((s) => s.id === 'sungai');
  const opacity = () => page.evaluate(() => (window as any).__dasMap.getPaintProperty('sungai-line', 'line-opacity'));
  await page.getByRole('button', { name: `Bagian ${iSungai + 1} dari ${story.length}` }).click();
  await expect.poll(() => activeStep(page)).toBe('sungai');
  await expect.poll(opacity).toEqual(expect.arrayContaining(['case'])); // sedang tumbuh
  await page.getByRole('button', { name: `Bagian ${iSungai + 2} dari ${story.length}` }).click();
  await expect.poll(() => activeStep(page)).toBe(story[iSungai + 1].id);
  // Masih ekspresi bertahap sesaat setelah pindah step (bukan langsung angka penuh)…
  expect(await opacity()).toEqual(expect.arrayContaining(['case']));
  // …lalu selesai penuh.
  await expect.poll(opacity, { timeout: 10_000 }).toBe(1);
});
