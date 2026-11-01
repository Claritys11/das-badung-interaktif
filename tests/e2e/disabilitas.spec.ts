import { expect, test } from '@playwright/test';
import { shot, watchConsole } from './helpers';
import { disabilitas } from '../../src/content/disabilitas';

test('disabilitas: pilihan langkah, daftar centang, tab kelompok (mouse & keyboard)', async ({ page }, info) => {
  const c = watchConsole(page);
  await page.goto('/embed/disabilitas.html');
  await expect(page.locator('.das-ds__bab')).toHaveCount(disabilitas.length);
  for (const img of await page.locator('.das-ds__gambar img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }

  // Pilihan: akibat baru tampil setelah memilih, dan bisa diganti.
  const akibat = page.locator('.das-ds__akibat');
  await expect(akibat).toBeEmpty();
  await page.getByRole('button', { name: 'Langsung angkat orangnya, tanpa kursi roda' }).click();
  await expect(akibat).toContainText('cerebral palsy');
  await page.getByRole('button', { name: 'Tanya dulu apa yang dibutuhkan' }).click();
  await expect(akibat).toContainText('Angkat kursi roda saya.');
  await expect(akibat).not.toContainText('cerebral palsy');
  await expect(page.getByRole('button', { name: 'Tanya dulu apa yang dibutuhkan' })).toHaveAttribute('aria-pressed', 'true');

  // Daftar centang menghitung langkah.
  await page.getByText('Arsipkan dokumen penting secara digital').click();
  await page.getByRole('checkbox', { name: 'Simpan berkas penting di kotak plastik kedap air' }).check();
  const pasangan = page.locator('.das-ds__ceklis-pasangan .das-ds__ceklis');
  await expect(pasangan.nth(0).locator('.das-ds__progres-teks')).toHaveText('2 dari 5 langkah sudah dilakukan');

  // Daftar kedua: 26 langkah, ukuran kartu sama dengan daftar pertama, butir terakhir terjangkau dengan digulir.
  await expect(pasangan.nth(1).getByRole('checkbox')).toHaveCount(26);
  const [a, b] = [await pasangan.nth(0).boundingBox(), await pasangan.nth(1).boundingBox()];
  expect(Math.abs(a!.width - b!.width)).toBeLessThan(1);
  expect(Math.abs(a!.height - b!.height)).toBeLessThan(1);
  // Lebar komponen menentukan susunan: berdampingan di desktop & tablet, bertumpuk di mobile.
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    expect(Math.abs(a!.y - b!.y)).toBeLessThan(1);
    const [ulA, ulB] = [await pasangan.nth(0).locator('ul').boundingBox(), await pasangan.nth(1).locator('ul').boundingBox()];
    expect(Math.abs(ulA!.y - ulB!.y)).toBeLessThan(1);
  } else expect(b!.y).toBeGreaterThan(a!.y + a!.height - 1);
  const terakhir = pasangan.nth(1).getByRole('checkbox', { name: /^Setiap orang memperoleh ganti kerugian/ });
  await terakhir.check();
  await expect(terakhir).toBeChecked();
  await expect(pasangan.nth(1).locator('.das-ds__progres-teks')).toHaveText('1 dari 26 langkah sudah dilakukan');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // Tab: klik, lalu panah kanan pindah ke kelompok berikutnya.
  await page.getByRole('tab', { name: 'Netra' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('indra pendengaran');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Tuli' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('SMS');
  await page.keyboard.press('End');
  await expect(page.getByRole('tabpanel')).toContainText('paling tertinggal');
  await shot(page, info, 'disabilitas');
  c.assertClean();
});
