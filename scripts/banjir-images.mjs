// Foto sebelum/sesudah banjir → AVIF + WebP multi-ukuran, dengan foto SESUDAH diselaraskan ke
// framing foto SEBELUM (mural & bangunan di posisi yang sama). Jalankan: pnpm banjir
// Input : raw/banjir/sebelum_banjir.jpeg (1485×892, Google Street View — TIDAK di-crop, watermark utuh)
//         raw/banjir/sesudah_banjir.jpeg (1600×1200, foto lapangan)
// Output: public/banjir/{sebelum,sesudah}-{640,1024,1485}.{avif,webp}
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'raw/banjir');
const OUT = path.join(root, 'public/banjir');
const W = 1485;
const H = 892;
const WIDTHS = [640, 1024, 1485];

// Transformasi similarity (skala + rotasi + geser) foto sesudah → bingkai foto sebelum, hasil fit
// least-squares dari 7 titik patokan yang tidak berubah: sudut mural (atas & bawah), kotak lampu,
// jendela menonjol (atas & bawah), jendela lantai dasar, parabola. Sisa selisih 3–10 px.
// Kalau foto diganti, ukur ulang titik patokannya lalu perbarui angka ini.
const ALIGN = { scale: 0.8326, rotationDeg: 1.81, tx: 162.5, ty: -35.4 };

async function alignedAfter(file) {
  const input = path.join(SRC, file);
  const { width: w0, height: h0 } = await sharp(input).metadata();
  const r = (ALIGN.rotationDeg * Math.PI) / 180;
  const a = ALIGN.scale * Math.cos(r);
  const b = ALIGN.scale * Math.sin(r);
  // Pusat foto sesudah dipetakan ke titik ini di bingkai foto sebelum.
  const cx = a * (w0 / 2) - b * (h0 / 2) + ALIGN.tx;
  const cy = b * (w0 / 2) + a * (h0 / 2) + ALIGN.ty;

  // Foto diputar (searah jarum jam) lalu diskalakan; latar transparan.
  const rotated = await sharp(input).rotate(ALIGN.rotationDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const rm = await sharp(rotated).metadata();
  const fw = Math.round(rm.width * ALIGN.scale);
  const fh = Math.round(rm.height * ALIGN.scale);
  const fg = await sharp(rotated).resize(fw, fh).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Tepi lembut: alfa di-blur lalu diperkuat, supaya sambungan ke latar tidak berupa garis keras.
  const alpha = await sharp(fg.data, { raw: fg.info }).extractChannel('alpha').blur(6).linear(2, -255).png().toBuffer();
  const fgSoft = await sharp(fg.data, { raw: fg.info }).removeAlpha().joinChannel(alpha).png().toBuffer();

  // Foto sesudah tidak menutupi strip kiri (±130–160 px) & sudut kanan bingkai. Area itu diisi versi
  // BURAM & GELAP dari foto sesudah sendiri (bukan isi foto sebelum — supaya tidak menyesatkan).
  const bg = await sharp(input).resize(W, H, { fit: 'cover' }).blur(45).modulate({ brightness: 0.55, saturation: 0.8 }).toBuffer();

  const PAD = 600; // kanvas lebih besar agar offset komposit selalu positif
  return sharp({ create: { width: W + 2 * PAD, height: H + 2 * PAD, channels: 3, background: '#000' } })
    .composite([
      { input: bg, left: PAD, top: PAD },
      { input: fgSoft, left: Math.round(PAD + cx - fw / 2), top: Math.round(PAD + cy - fh / 2) },
    ])
    .png()
    .toBuffer()
    .then((buf) => sharp(buf).extract({ left: PAD, top: PAD, width: W, height: H }).png().toBuffer());
}

const kb = (b) => (b / 1024).toFixed(0);

async function writeVariants(name, source) {
  let total = 0;
  for (const w of WIDTHS) {
    const img = sharp(source).resize({ width: w, withoutEnlargement: true });
    const avif = await img.clone().avif({ quality: 55, effort: 4 }).toFile(path.join(OUT, `${name}-${w}.avif`));
    const webp = await img.clone().webp({ quality: 78, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.webp`));
    total += avif.size + webp.size;
  }
  return total;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const before = (await stat(path.join(SRC, 'sebelum_banjir.jpeg'))).size + (await stat(path.join(SRC, 'sesudah_banjir.jpeg'))).size;
  const a = await writeVariants('sebelum', path.join(SRC, 'sebelum_banjir.jpeg'));
  const b = await writeVariants('sesudah', await alignedAfter('sesudah_banjir.jpeg'));
  console.log(`Sebelum (JPEG asli): ${kb(before)} KB → semua varian AVIF+WebP: ${kb(a + b)} KB`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
