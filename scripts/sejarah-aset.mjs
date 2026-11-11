// Aset visual sejarah. Jalankan: pnpm sejarah
// Input : raw/sejarah/kmz/*.kmz, raw/sejarah/foto/*, raw/sejarah/sejarah.gif
// Output: src/content/sejarah-peta.ts (titik, garis, sudut peta lama; digenerate, jangan diedit)
//         public/sejarah/peta-{1915,1930}.jpg, <foto>-{640,1050}.{avif,webp},
//         hero.mp4, hero.webm, hero-poster.webp (butuh ffmpeg di PATH)
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import JSZip from 'jszip';
import sharp from 'sharp';
import { DOMParser } from '@xmldom/xmldom';
import { kml } from '@tmcw/togeojson';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'raw/sejarah');
const OUT = path.join(root, 'public/sejarah');
const WIDTHS = [640, 1050];

const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
const parseKml = (s) => new DOMParser().parseFromString(s, 'text/xml');
const bulat = (n) => Math.round(n * 1e7) / 1e7;

async function bukaKmz(nama) {
  const zip = await JSZip.loadAsync(await readFile(path.join(RAW, 'kmz', `${nama}.kmz`)));
  return { zip, doc: parseKml(await zip.file('doc.kml').async('string')) };
}

async function titikDanGaris(nama) {
  const { doc } = await bukaKmz(nama);
  const fitur = kml(doc).features;
  const titik = fitur
    .filter((f) => f.geometry?.type === 'Point')
    .map((f) => ({ nama: f.properties.name, lngLat: f.geometry.coordinates.slice(0, 2).map(bulat) }));
  const garis = fitur
    .filter((f) => f.geometry?.type === 'LineString')
    .map((f) => f.geometry.coordinates.map((c) => c.slice(0, 2).map(bulat)));
  return { titik, garis };
}

/** GroundOverlay KML → 4 sudut [kiri-atas, kanan-atas, kanan-bawah, kiri-bawah] untuk image source MapLibre.
 *  `rotation` KML berlawanan jarum jam dari utara, berporos di tengah kotak; dihitung di bidang meter
 *  (bujur dikali cos lintang) supaya sudutnya tidak melar. */
async function petaLama(nama, keluar) {
  const { zip, doc } = await bukaKmz(nama);
  const nilai = (tag) => Number(doc.getElementsByTagName(tag)[0].textContent);
  const [n, s, e, w, rot] = ['north', 'south', 'east', 'west', 'rotation'].map(nilai);
  const href = doc.getElementsByTagName('href')[0].textContent;
  const cy = (n + s) / 2;
  const cx = (e + w) / 2;
  const k = Math.cos((cy * Math.PI) / 180);
  const t = (rot * Math.PI) / 180;
  const putar = ([lon, lat]) => {
    const x = (lon - cx) * k;
    const y = lat - cy;
    return [bulat(cx + (x * Math.cos(t) - y * Math.sin(t)) / k), bulat(cy + x * Math.sin(t) + y * Math.cos(t))];
  };
  const buf = await zip.file(href).async('nodebuffer');
  await writeFile(path.join(OUT, keluar), buf);
  return {
    file: keluar,
    sudut: [
      [w, n],
      [e, n],
      [e, s],
      [w, s],
    ].map(putar),
  };
}

async function fotoFoto() {
  for (const file of await readdir(path.join(RAW, 'foto'))) {
    const nama = path.parse(file).name;
    const input = path.join(RAW, 'foto', file);
    const { width, height } = await sharp(input).metadata();
    let total = 0;
    for (const w of WIDTHS.filter((v, i) => i === 0 || width >= v)) {
      const img = sharp(input).flatten({ background: '#14181c' }).resize({ width: w, withoutEnlargement: true });
      total += (
        await img
          .clone()
          .avif({ quality: 55, effort: 4 })
          .toFile(path.join(OUT, `${nama}-${w}.avif`))
      ).size;
      total += (
        await img
          .clone()
          .webp({ quality: 80, effort: 6 })
          .toFile(path.join(OUT, `${nama}-${w}.webp`))
      ).size;
    }
    console.log(`✓ ${file} ${width}×${height} → ${kb(total)}`);
  }
}

/** GIF 54 MB → video bisu. Tetap 1894×740 & 30 fps; hqdn3d meredam bintik dither palet GIF yang boros bit. */
async function hero() {
  const gif = path.join(RAW, 'sejarah.gif');
  const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', gif, ...a], { stdio: 'inherit' });
  const vf = ['-vf', 'hqdn3d=1.5:1.5:4:4,format=yuv420p', '-an'];
  ff(...vf, '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '25', '-movflags', '+faststart', path.join(OUT, 'hero.mp4'));
  ff(...vf, '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-cpu-used', '2', path.join(OUT, 'hero.webm'));
  ff('-frames:v', '1', '-c:v', 'libwebp', '-quality', '78', path.join(OUT, 'hero-poster.webp'));
  for (const f of ['hero.mp4', 'hero.webm', 'hero-poster.webp']) console.log(`✓ ${f} ${kb((await stat(path.join(OUT, f))).size)}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const sekarang = await titikDanGaris('Lokasi Tapak Dara Masa Sekarang');
  const kerajaan = await titikDanGaris('Lokasi Tapak Dara Masa Kerajaan');
  const peta1915 = await petaLama('Peta Catuspatha Denpasar 1915', 'peta-1915.jpg');
  const peta1930 = await petaLama('Peta Catuspatha Denpasar 1930', 'peta-1930.jpg');
  const ts = `// DIGENERATE oleh scripts/sejarah-aset.mjs dari raw/sejarah/kmz/*.kmz. Jangan diedit manual.
export const titikSekarang = ${JSON.stringify(sekarang.titik)} as { nama: string; lngLat: [number, number] }[];
export const titikKerajaan = ${JSON.stringify(kerajaan.titik)} as { nama: string; lngLat: [number, number] }[];
/** Garis merah tapak dara; tiap garis dimulai dari perempatan lalu menjauh. */
export const garisTapakDara = ${JSON.stringify(kerajaan.garis)} as [number, number][][];
type Sudut = [[number, number], [number, number], [number, number], [number, number]];
export const petaLama = {
  '1915': ${JSON.stringify(peta1915)} as { file: string; sudut: Sudut },
  '1930': ${JSON.stringify(peta1930)} as { file: string; sudut: Sudut },
};
`;
  await writeFile(path.join(root, 'src/content/sejarah-peta.ts'), ts);
  console.log(ts);
  await fotoFoto();
  await hero();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
