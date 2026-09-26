import { expect, test } from '@playwright/test';
import { shot, watchConsole } from './helpers';

const year = (page: import('@playwright/test').Page) => page.locator('.das-ss__year').innerText();

test('slideshow: navigasi, keyboard, play/pause, swipe', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/embed/slideshow.html?autoplay=0');
  await expect(page.locator('.das-ss__slide img')).toHaveJSProperty('complete', true);
  expect(await year(page)).toBe('2005');
  await shot(page, info, 'slideshow-2005');

  await page.getByRole('button', { name: 'Citra berikutnya' }).click();
  await expect(page.locator('.das-ss__year')).toHaveText('2006');

  await page.locator('.das-ss__frame').focus();
  await page.keyboard.press('End');
  await expect(page.locator('.das-ss__year')).toHaveText('2023');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.das-ss__year')).toHaveText('2005');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.das-ss__year')).toHaveText('2023');

  // Swipe kiri → berikutnya (wrap ke 2005)
  const box = (await page.locator('.das-ss__frame').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('.das-ss__year')).toHaveText('2005');

  // Penggaris waktu: klik ujung kanan → 2023
  const r = (await page.locator('.das-ss__track').boundingBox())!;
  await page.mouse.click(r.x + r.width - 1, r.y + r.height / 2);
  await expect(page.locator('.das-ss__year')).toHaveText('2023');

  const play = page.locator('.das-ss__play');
  await expect(play).toHaveAttribute('aria-label', 'Putar slideshow');
  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Jeda slideshow');
  await shot(page, info, 'slideshow-2023');
  c.assertClean();
});

test('slideshow: autoplay berjalan dan berhenti saat hover', async ({ page }) => {
  await page.goto('/embed/slideshow.html?interval=1200');
  await expect(page.locator('.das-ss__year')).not.toHaveText('2005', { timeout: 5000 });
  await page.locator('.das-ss__frame').hover();
  const held = await year(page);
  await page.waitForTimeout(2600);
  expect(await year(page)).toBe(held);
});

test('slideshow: prefers-reduced-motion mematikan autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/embed/slideshow.html?interval=1000');
  await page.waitForTimeout(2500);
  await expect(page.locator('.das-ss__year')).toHaveText('2005');
  await expect(page.locator('.das-ss__play')).toHaveAttribute('aria-label', 'Putar slideshow');
});
