// Gambar visual disabilitas → AVIF + WebP (640 & 1050 px, tanpa crop). Jalankan: pnpm disabilitas
// Input : raw/disabilitas/*.png (1050×585, sudah berlogo INSIDE NESIA dari redaksi)
// Output: public/disabilitas/<nama>-{640,1050}.{avif,webp}
import { mkdir, readdir, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'raw/disabilitas');
const OUT = path.join(root, 'public/disabilitas');
const WIDTHS = [640, 1050];

const kb = (b) => (b / 1024).toFixed(0);

async function main() {
  await mkdir(OUT, { recursive: true });
  let before = 0;
  let after = 0;
  for (const file of (await readdir(SRC)).filter((f) => f.endsWith('.png'))) {
    const input = path.join(SRC, file);
    const name = path.basename(file, '.png');
    before += (await stat(input)).size;
    for (const w of WIDTHS) {
      const img = sharp(input).resize({ width: w, withoutEnlargement: true });
      after += (
        await img
          .clone()
          .avif({ quality: 55, effort: 4 })
          .toFile(path.join(OUT, `${name}-${w}.avif`))
      ).size;
      after += (
        await img
          .clone()
          .webp({ quality: 80, effort: 6 })
          .toFile(path.join(OUT, `${name}-${w}.webp`))
      ).size;
    }
    console.log(`✓ ${file} → ${name}`);
  }
  console.log(`PNG asli: ${kb(before)} KB → semua varian AVIF+WebP: ${kb(after)} KB`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
