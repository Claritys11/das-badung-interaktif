// Citra satelit JPG → AVIF + WebP multi-ukuran. Jalankan: pnpm images
// Input : raw/citra/*.jpg   Output: public/citra/<slug>-<lebar>.{avif,webp}
// Citra TIDAK di-crop: watermark "Google Earth" & "Image © Maxar" harus tetap terlihat.
import { readdir, stat, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'raw/citra');
const OUT = path.join(root, 'public/citra');
export const WIDTHS = [640, 1024, 1485];

// "Maret 2014.jpg" → "2014-03", "Oktober 2014.jpg" → "2014-10", "2015.jpg" → "2015"
const BULAN = { januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06', juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12' };
export function slugCitra(file) {
  const base = path.parse(file).name.trim().toLowerCase();
  const m = base.match(/^([a-z]+)\s+(\d{4})$/);
  if (m && BULAN[m[1]]) return `${m[2]}-${BULAN[m[1]]}`;
  return base.replace(/[^a-z0-9]+/g, '-');
}

const kb = (b) => (b / 1024).toFixed(0);

async function main() {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => /\.jpe?g$/i.test(f)).sort();
  let before = 0;
  const after = { avif: 0, webp: 0 };
  const perWidth = {};
  for (const file of files) {
    const input = path.join(SRC, file);
    before += (await stat(input)).size;
    const slug = slugCitra(file);
    for (const w of WIDTHS) {
      const img = sharp(input).resize({ width: w, withoutEnlargement: true });
      const avif = await img.clone().avif({ quality: 55, effort: 4 }).toFile(path.join(OUT, `${slug}-${w}.avif`));
      const webp = await img.clone().webp({ quality: 78, effort: 6 }).toFile(path.join(OUT, `${slug}-${w}.webp`));
      after.avif += avif.size;
      after.webp += webp.size;
      perWidth[w] ??= { avif: 0, webp: 0 };
      perWidth[w].avif += avif.size;
      perWidth[w].webp += webp.size;
    }
    console.log(`✓ ${file} → ${slug}`);
  }
  console.log(`\n${files.length} citra`);
  console.log(`Sebelum (JPG asli)          : ${kb(before)} KB`);
  for (const w of WIDTHS) console.log(`Sesudah ${String(w).padStart(4)}px  AVIF ${kb(perWidth[w].avif).padStart(5)} KB | WebP ${kb(perWidth[w].webp).padStart(5)} KB`);
  console.log(`Total semua varian         : AVIF ${kb(after.avif)} KB | WebP ${kb(after.webp)} KB`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
