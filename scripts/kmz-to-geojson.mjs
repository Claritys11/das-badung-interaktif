// Konversi KMZ → GeoJSON statis (build time). Jalankan: pnpm data
// Input : raw/kmz/*.kmz        Output: public/data/*.geojson
// Juga membuat src/content/titik-banjir.ts SEKALI (tidak menimpa hasil edit redaksi).
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { kml } from '@tmcw/togeojson';
import simplify from '@turf/simplify';
import bbox from '@turf/bbox';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KMZ_DIR = path.join(root, 'raw/kmz');
const OUT_DIR = path.join(root, 'public/data');
const CONTENT_FILE = path.join(root, 'src/content/titik-banjir.ts');

async function readKmz(file) {
  const zip = await JSZip.loadAsync(await readFile(path.join(KMZ_DIR, file)));
  const docName = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith('.kml'));
  if (!docName) throw new Error(`${file}: tidak ada .kml di dalam KMZ`);
  const xml = await zip.file(docName).async('string');
  return kml(new DOMParser().parseFromString(xml, 'text/xml'));
}

// Bulatkan koordinat (6 desimal ≈ 11 cm) untuk memangkas ukuran file.
function roundCoords(c) {
  return typeof c[0] === 'number' ? c.slice(0, 2).map((v) => Math.round(v * 1e6) / 1e6) : c.map(roundCoords);
}
function clean(fc) {
  for (const f of fc.features) f.geometry.coordinates = roundCoords(f.geometry.coordinates);
  return fc;
}
const fc = (features) => ({ type: 'FeatureCollection', features });

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7F]/g, '') // buang aksara non-Latin (mis. aksara Bali) & zero-width
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
const text = (s) => (s ?? '').toString().replace(/<!\[CDATA\[|\]\]>/g, '').replace(/[​]/g, '').trim();
// Style id KMZ: "#poly-32C739-1000-178" / "#line-A1C2FA-4273-nodesc" / "#icon-1703-A52714"
const styleParts = (url) => (url ?? '').replace(/^#/, '').replace(/-(normal|highlight)$/, '').split('-');

async function write(name, data) {
  const json = JSON.stringify(data);
  await writeFile(path.join(OUT_DIR, name), json);
  return { name, features: data.features.length, kb: +(json.length / 1024).toFixed(1) };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const report = [];

  // 1. DAS — 3 polygon, dibedakan oleh warna asli di KMZ.
  const das = await readKmz('DAS.kmz');
  const dasFeatures = das.features.map((f, i) => {
    const [, hex] = styleParts(f.properties.styleUrl);
    return {
      type: 'Feature',
      id: i + 1,
      properties: { id: `das-${i + 1}`, nama: text(f.properties.name), warna: `#${hex}` },
      geometry: f.geometry,
    };
  });
  report.push(await write('das.geojson', clean(simplify(fc(dasFeatures), { tolerance: 0.00005, highQuality: true }))));

  // 2. Garis sungai — 19 LineString. Angka di style id (mis. 4273) = lebar garis ×1000 di Google My Maps.
  const sungai = await readKmz('Garis sungai di kawasan DAS Badung.kmz');
  const sungaiFeatures = sungai.features.map((f, i) => {
    const [, , lebar] = styleParts(f.properties.styleUrl);
    return {
      type: 'Feature',
      id: i + 1,
      properties: { id: `sungai-${String(i + 1).padStart(2, '0')}`, nama: text(f.properties.name), lebar: Number(lebar) / 1000 || 1 },
      geometry: f.geometry,
    };
  });
  report.push(await write('sungai.geojson', clean(fc(sungaiFeatures))));

  // 3. Topografi — 5 kelas ketinggian (vektor). Nama "Ketinggian 0-50 Meter", "Ketinggian >1000 Meter".
  const topo = await readKmz('Topografi.kmz');
  const topoFeatures = topo.features.map((f, i) => {
    const nama = text(f.properties.name);
    const m = nama.match(/(\d+)\s*-\s*(\d+)/);
    const lebihDari = nama.match(/>\s*(\d+)/);
    const minM = m ? Number(m[1]) : Number(lebihDari?.[1] ?? 0);
    const maxM = m ? Number(m[2]) : null;
    // Kelas pertama di KMZ berisi polygon + 1 garis tepi; buang geometri non-polygon.
    let geometry = f.geometry;
    if (geometry.type === 'GeometryCollection') {
      const polys = geometry.geometries.filter((g) => g.type === 'Polygon');
      geometry = { type: 'MultiPolygon', coordinates: polys.map((p) => p.coordinates) };
    }
    return {
      type: 'Feature',
      id: i + 1,
      properties: { id: `topo-${i + 1}`, nama, kelas: i + 1, minM, maxM },
      geometry,
    };
  });
  report.push(await write('topografi.geojson', clean(simplify(fc(topoFeatures), { tolerance: 0.0004, highQuality: true }))));

  // 4. Titik banjir — 80 Point. Pertahankan nama & deskripsi asli per titik.
  const banjir = await readKmz('Titik banjir.kmz');
  const used = new Set();
  const banjirFeatures = banjir.features.map((f, i) => {
    const nama = text(f.properties.name);
    let slug = `banjir-${slugify(nama)}`;
    while (used.has(slug)) slug += '-2';
    used.add(slug);
    const [, iconCode] = styleParts(f.properties.styleUrl);
    const deskripsiKmz = [f.properties.deskripsi, f.properties.description].map(text).filter(Boolean).join(' — ') || null;
    return {
      type: 'Feature',
      id: i + 1, // id numerik untuk feature-state MapLibre
      properties: { id: slug, nama, ikon: iconCode === '1703' ? 'fasilitas-air' : 'umum', deskripsiKmz },
      geometry: f.geometry,
    };
  });
  const banjirFc = clean(fc(banjirFeatures));
  report.push(await write('titik-banjir.geojson', banjirFc));

  console.table(report);
  console.log('bbox DAS       :', bbox(fc(dasFeatures)).map((v) => v.toFixed(4)).join(', '));
  console.log('bbox titik     :', bbox(banjirFc).map((v) => v.toFixed(4)).join(', '));
  console.log('deskripsi KMZ  :', banjirFeatures.filter((f) => f.properties.deskripsiKmz).length, 'titik');

  // 5. Skeleton konten titik — hanya dibuat jika belum ada.
  try {
    await access(CONTENT_FILE);
    console.log(`\n${path.relative(root, CONTENT_FILE)} sudah ada — tidak ditimpa. Titik baru (jika ada) cek manual:`);
    const existing = await readFile(CONTENT_FILE, 'utf8');
    const missing = banjirFeatures.filter((f) => !existing.includes(`'${f.properties.id}'`));
    console.log(missing.length ? missing.map((f) => `  - ${f.properties.id}`).join('\n') : '  (semua titik sudah punya entri)');
  } catch {
    const entries = banjirFeatures
      .map(({ properties: p }) => {
        const deskripsi = p.deskripsiKmz
          ? { teks: p.deskripsiKmz, sumber: 'kmz' }
          : { teks: `[Penjelasan titik ${p.nama} — diisi redaksi]`, sumber: 'placeholder' };
        return `  '${p.id}': {\n    judul: ${JSON.stringify(p.nama)},\n    deskripsi: ${JSON.stringify(deskripsi.teks)},\n    sumber: '${deskripsi.sumber}',\n    tampil: true,\n  },`;
      })
      .join('\n');
    await mkdir(path.dirname(CONTENT_FILE), { recursive: true });
    await writeFile(
      CONTENT_FILE,
      `// Konten per titik banjir. Kunci = id stabil dari scripts/kmz-to-geojson.mjs.\n` +
        `// sumber: 'kmz' = teks asli dari KMZ (data sumber), 'placeholder' = WAJIB diganti redaksi.\n` +
        `// tampil: false untuk menyembunyikan titik tanpa menghapus data.\n` +
        `import type { KontenTitik } from './types';\n\n` +
        `export const titikBanjir: Record<string, KontenTitik> = {\n${entries}\n};\n`,
    );
    console.log(`\nDibuat: ${path.relative(root, CONTENT_FILE)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
