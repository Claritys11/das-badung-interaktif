// Foto sebelum/sesudah banjir → AVIF + WebP multi-ukuran (foto ASLI: tanpa crop, tanpa penyelarasan).
// Jalankan: pnpm banjir
// Input : raw/banjir/sebelum_banjir.jpeg (1485×892, Google Earth — watermark utuh)
//         raw/banjir/sesudah_banjir.jpeg (1600×1200, IDN Times)
// Output: public/banjir/{sebelum,sesudah}-{640,1024,1485}.{avif,webp}
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'raw/banjir');
const OUT = path.join(root, 'public/banjir');
const WIDTHS = [640, 1024, 1485];
const FOTO = [
  ['sebelum', 'sebelum_banjir.jpeg'],
  ['sesudah', 'sesudah_banjir.jpeg'],
];

const kb = (b) => (b / 1024).toFixed(0);

async function main() {
  await mkdir(OUT, { recursive: true });
  let before = 0;
  let after = 0;
  for (const [name, file] of FOTO) {
    const input = path.join(SRC, file);
    before += (await stat(input)).size;
    const { width, height } = await sharp(input).metadata();
    for (const w of WIDTHS) {
      const img = sharp(input).resize({ width: w, withoutEnlargement: true });
      after += (await img.clone().avif({ quality: 55, effort: 4 }).toFile(path.join(OUT, `${name}-${w}.avif`))).size;
      after += (await img.clone().webp({ quality: 78, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.webp`))).size;
    }
    console.log(`✓ ${file} (${width}×${height}) → ${name}`);
  }
  console.log(`JPEG asli: ${kb(before)} KB → semua varian AVIF+WebP: ${kb(after)} KB`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
