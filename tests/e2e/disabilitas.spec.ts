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
  await expect(page.locator('.das-ds__progres-teks')).toHaveText('2 dari 5 langkah sudah dilakukan');

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
